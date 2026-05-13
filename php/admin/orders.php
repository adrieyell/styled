<?php
// ============================================
// ORDERS API — php/admin/orders.php
// GET  ?page=1&limit=8&status=&search=   → list
// GET  ?id=STY-123456                    → single order
// PUT  {order_id, status, tracking_number, estimated_delivery} → update (admin + staff)
// ============================================

header('Content-Type: application/json');
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/../db.php';

$user   = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$pdo    = getPDO();

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {

    // Single order
    if (!empty($_GET['id'])) {
        $stmt = $pdo->prepare("
            SELECT o.*,
                   u.full_name  AS customer_name,
                   u.email      AS customer_email,
                   a.street, a.city, a.province, a.zip_code
            FROM orders o
            LEFT JOIN users     u ON u.user_id    = o.user_id
            LEFT JOIN addresses a ON a.address_id = o.address_id
            WHERE o.order_number = ?
        ");
        $stmt->execute([$_GET['id']]);
        $order = $stmt->fetch();

        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Order not found.']);
            exit;
        }

        // Items
        $items = $pdo->prepare("
            SELECT oi.*, p.name AS product_name, oi.size
            FROM order_items oi
            JOIN products p ON p.product_id = oi.product_id
            WHERE oi.order_id = ?
        ");
        $items->execute([$order['order_id']]);
        $order['items'] = $items->fetchAll();

        // Timeline
        $tl = $pdo->prepare("
            SELECT step_label, occurred_at, note
            FROM order_timeline
            WHERE order_id = ?
            ORDER BY occurred_at ASC, timeline_id ASC
        ");
        $tl->execute([$order['order_id']]);
        $order['timeline'] = $tl->fetchAll();

        echo json_encode(['success' => true, 'order' => $order]);
        exit;
    }

    // List with filters + pagination
    $page   = max(1, (int) ($_GET['page']  ?? 1));
    $limit  = min(50, max(1, (int) ($_GET['limit'] ?? 8)));
    $offset = ($page - 1) * $limit;
    $status = $_GET['status'] ?? '';
    $search = $_GET['search'] ?? '';

    $where  = [];
    $params = [];

    if ($status) {
        $where[]  = 'o.status = ?';
        $params[] = $status;
    }
    if ($search) {
        $where[]  = '(o.order_number LIKE ? OR u.full_name LIKE ?)';
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $total = $pdo->prepare("
        SELECT COUNT(*) FROM orders o
        LEFT JOIN users u ON u.user_id = o.user_id
        $whereSQL
    ");
    $total->execute($params);
    $totalCount = (int) $total->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT o.order_id, o.order_number, o.status, o.payment_method,
               o.total_amount, o.created_at, o.tracking_number,
               o.estimated_delivery,
               u.full_name AS customer_name, u.email AS customer_email
        FROM orders o
        LEFT JOIN users u ON u.user_id = o.user_id
        $whereSQL
        ORDER BY o.created_at DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'orders'  => $orders,
        'total'   => $totalCount,
        'page'    => $page,
        'pages'   => (int) ceil($totalCount / $limit),
    ]);
    exit;
}

// ── PUT: Update status / tracking ─────────────────────────────────────────────
if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    if (empty($body['order_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing order_id.']);
        exit;
    }

    $orderId   = (int) $body['order_id'];
    $newStatus = isset($body['status']) ? strtolower(trim($body['status'])) : null;

    // Staff cannot cancel or refund
    if ($user['role'] === 'staff' && in_array($newStatus, ['cancelled', 'refunded'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Staff cannot cancel or refund orders.']);
        exit;
    }

    // ── Fetch the current order row ───────────────────────────────────────────
    $current = $pdo->prepare('SELECT order_id, status, tracking_number FROM orders WHERE order_id = ?');
    $current->execute([$orderId]);
    $currentOrder = $current->fetch(PDO::FETCH_ASSOC);

    if (!$currentOrder) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Order not found.']);
        exit;
    }

    // ── Build UPDATE fields ───────────────────────────────────────────────────
    $fields = [];
    $params = [];

    if ($newStatus !== null) {
        $fields[] = 'status = ?';
        $params[] = $newStatus;
    }

    $trackingNumber = null;
    if (array_key_exists('tracking_number', $body)) {
        $trackingNumber = trim($body['tracking_number'] ?? '');
        $fields[]       = 'tracking_number = ?';
        $params[]       = $trackingNumber ?: null;
    }

    if (array_key_exists('estimated_delivery', $body)) {
        $fields[] = 'estimated_delivery = ?';
        $params[] = $body['estimated_delivery'] ?: null;
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Nothing to update.']);
        exit;
    }

    $params[] = $orderId;
    $pdo->prepare(
        'UPDATE orders SET ' . implode(', ', $fields) . ' WHERE order_id = ?'
    )->execute($params);

    // ── Insert into order_timeline when status changes ────────────────────────
    if ($newStatus !== null && $newStatus !== strtolower($currentOrder['status'])) {

        // Map DB status to the canonical stepper label used on the front-end
        $statusToLabel = [
            'pending'    => 'Order Placed',
            'processing' => 'Processing',
            'shipped'    => 'Shipped',
            'delivered'  => 'Delivered',
            'cancelled'  => 'Cancelled',
        ];

        $stepLabel = $statusToLabel[$newStatus] ?? ucfirst($newStatus);
        $note      = $body['note'] ?? null;

        $pdo->prepare(
            'INSERT INTO order_timeline (order_id, step_label, occurred_at, note)
             VALUES (?, ?, NOW(), ?)'
        )->execute([$orderId, $stepLabel, $note]);

        // If the order is now "shipped" and a tracking number was just provided
        // (or was already stored), also record an "Out for Delivery" placeholder
        // only if the admin explicitly passes out_for_delivery = true.
        if ($newStatus === 'shipped' && !empty($body['out_for_delivery'])) {
            $pdo->prepare(
                'INSERT INTO order_timeline (order_id, step_label, occurred_at, note)
                 VALUES (?, ?, NOW(), ?)'
            )->execute([$orderId, 'Out for Delivery', null]);
        }
    }

    // ── If a tracking number is being saved for the first time, also ensure
    //    the "Shipped" timeline step exists (in case admin skipped that PUT). ──
    if (
        $trackingNumber &&
        empty($currentOrder['tracking_number'])
    ) {
        // Only insert if "Shipped" row not already present
        $exists = $pdo->prepare(
            "SELECT 1 FROM order_timeline
             WHERE order_id = ? AND step_label = 'Shipped'
             LIMIT 1"
        );
        $exists->execute([$orderId]);

        if (!$exists->fetchColumn()) {
            $pdo->prepare(
                "INSERT INTO order_timeline (order_id, step_label, occurred_at, note)
                 VALUES (?, 'Shipped', NOW(), ?)"
            )->execute([$orderId, 'Tracking number assigned: ' . $trackingNumber]);
        }
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);