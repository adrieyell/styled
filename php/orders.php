<?php
// ============================================
// ORDERS API  -  php/orders.php
// ============================================

ob_start();
ini_set('display_errors', '0');
error_reporting(E_ALL);

session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

// ── Auth guard ────────────────────────────────────────────────────────────────
if (empty($_SESSION['user_id'])) {
    ob_end_clean();
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized', 'logged_in' => false]);
    exit;
}

$user_id = (int) $_SESSION['user_id'];
$method  = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format a decimal amount as ₱1,234.00
 */
function format_price(float $amount): string {
    return '₱' . number_format($amount, 2);
}

/**
 * Format a MySQL timestamp/date into "Month DD, YYYY"
 */
function format_date(string $date): string {
    if (!$date || $date === '0000-00-00 00:00:00') return '—';
    $ts = strtotime($date);
    return $ts ? date('F d, Y', $ts) : '—';
}

/**
 * Map DB status string to display label (capitalised).
 * DB enum: pending | processing | shipped | delivered | cancelled
 */
function display_status(string $status): string {
    return ucfirst(strtolower($status));
}

/**
 * Build the 5-step tracking timeline from an order row.
 * Steps: Order Placed → Processing → Shipped → Out for Delivery → Delivered
 *
 * We derive dates from created_at plus rough offsets;
 * a real app would store per-event timestamps in a separate table.
 */
function build_tracking(array $order): array {
    $created  = $order['created_at'];
    $statusRaw = strtolower($order['status']);

    // Map status → how many steps are "done"
    $doneMap = [
        'pending'    => 1,
        'processing' => 2,
        'shipped'    => 3,
        'delivered'  => 5,
        'cancelled'  => 1,
    ];
    $doneCount = $doneMap[$statusRaw] ?? 1;

    // Rough date offsets (days after created_at) for each step
    $offsets = [0, 0, 1, 2, 3];

    $steps = [
        'Order Placed',
        'Processing',
        'Shipped',
        'Out for Delivery',
        'Delivered',
    ];

    $timeline = [];
    foreach ($steps as $i => $label) {
        $stepDone = ($i + 1) <= $doneCount;
        $isActive = ($i + 1) === $doneCount;

        if ($stepDone && $created) {
            $ts   = strtotime($created) + ($offsets[$i] * 86400);
            $date = date('F d, Y', $ts);
        } else {
            $date = '—';
        }

        $step = [
            'label' => $label,
            'date'  => $date,
            'done'  => $stepDone,
        ];
        if ($isActive && $statusRaw !== 'delivered') {
            $step['active'] = true;
        }
        $timeline[] = $step;
    }

    return $timeline;
}

// ── Fetch product info for an order item (name, image) ───────────────────────
function get_product_info(PDO $pdo, int $product_id): array {
    static $cache = [];
    if (isset($cache[$product_id])) return $cache[$product_id];

    $stmt = $pdo->prepare(
        'SELECT p.name,
                COALESCE(
                    (SELECT pi.image_url
                     FROM product_images pi
                     WHERE pi.product_id = p.product_id
                     ORDER BY pi.sort_order ASC, pi.image_id ASC
                     LIMIT 1),
                    ""
                ) AS img
         FROM products p
         WHERE p.product_id = :pid
         LIMIT 1'
    );
    $stmt->execute([':pid' => $product_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $info = $row
        ? ['name' => $row['name'], 'img' => $row['img']]
        : ['name' => 'Unknown Product', 'img' => ''];

    $cache[$product_id] = $info;
    return $info;
}

// ── Build a full order object from a DB row ───────────────────────────────────
function build_order(PDO $pdo, array $order): array {
    $orderId   = (int) $order['order_id'];
    $shippingFee = (float) $order['shipping_fee'];
    $grandTotal  = (float) $order['grand_total'];

    // Fetch items
    $stmt = $pdo->prepare(
        'SELECT oi.product_id, oi.size, oi.qty, oi.unit_price
         FROM order_items oi
         WHERE oi.order_id = :oid'
    );
    $stmt->execute([':oid' => $orderId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $items = [];
    foreach ($rows as $row) {
        $prod = get_product_info($pdo, (int) $row['product_id']);
        $items[] = [
            'name'  => $prod['name'],
            'price' => format_price((float) $row['unit_price']),
            'qty'   => (int) $row['qty'],
            'color' => '',          // not stored per-item in DB
            'size'  => $row['size'] ?? '—',
            'img'   => $prod['img'],
        ];
    }

    // Shipping address
    $addrStr = '—';
    if (!empty($order['street'])) {
        $parts = array_filter([
            $order['street'],
            $order['city'],
            $order['province'] . ' ' . $order['zip_code'],
            'Philippines',
        ]);
        $addrStr = implode("\n", $parts);
    }

    $statusDisplay = display_status($order['status']);

    return [
        'id'        => $order['order_number'],
        'date'      => format_date($order['created_at']),
        'dateISO'   => $order['created_at'] ? date('Y-m-d', strtotime($order['created_at'])) : '',
        'status'    => $statusDisplay,
        'total'     => format_price($grandTotal),
        'totalNum'  => $grandTotal,
        'items'     => $items,
        'shipping'  => [
            'address' => $addrStr,
            'cost'    => $shippingFee,
        ],
        'tracking'  => build_tracking($order),
    ];
}

// ── Base query ────────────────────────────────────────────────────────────────
$BASE_SQL =
    'SELECT o.order_id, o.order_number, o.status, o.subtotal,
            o.shipping_fee, o.discount, o.grand_total,
            o.payment_method, o.created_at,
            a.street, a.city, a.province, a.zip_code
     FROM orders o
     LEFT JOIN addresses a ON a.address_id = o.address_id
     WHERE o.user_id = :uid';

try {
    $pdo = getPDO();

    // ── GET /php/orders.php?id={order_number} — single order ─────────────────
    if (!empty($_GET['id'])) {
        $orderNumber = trim($_GET['id']);

        $stmt = $pdo->prepare($BASE_SQL . ' AND o.order_number = :on LIMIT 1');
        $stmt->execute([':uid' => $user_id, ':on' => $orderNumber]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            ob_end_clean();
            http_response_code(404);
            echo json_encode(['error' => 'Order not found']);
            exit;
        }

        ob_end_clean();
        echo json_encode(['order' => build_order($pdo, $row)]);
        exit;
    }

    // ── GET /php/orders.php — all orders for user ─────────────────────────────
    $stmt = $pdo->prepare($BASE_SQL . ' ORDER BY o.created_at DESC');
    $stmt->execute([':uid' => $user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orders = [];
    foreach ($rows as $row) {
        $orders[] = build_order($pdo, $row);
    }

    ob_end_clean();
    echo json_encode(['orders' => $orders]);

} catch (Throwable $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'detail' => $e->getMessage()]);
}