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

function format_price(float $amount): string {
    return '₱' . number_format($amount, 2);
}

function format_date(string $date): string {
    if (!$date || $date === '0000-00-00 00:00:00') return '—';
    $ts = strtotime($date);
    return $ts ? date('F d, Y', $ts) : '—';
}

function display_status(string $status): string {
    return ucfirst(strtolower($status));
}

// ── The 5 canonical stepper steps ────────────────────────────────────────────
const TIMELINE_STEPS = [
    'Order Placed',
    'Processing',
    'Shipped',
    'Out for Delivery',
    'Delivered',
];

// Map DB status → how many steps are "done" (used only as fallback)
const STATUS_DONE_MAP = [
    'pending'    => 1,
    'processing' => 2,
    'shipped'    => 3,
    'delivered'  => 5,
    'cancelled'  => 1,
];

/**
 * Build the tracking timeline for an order.
 *
 * Strategy (DB-first):
 *   1. Query order_timeline for rows matching this order_id, ordered by
 *      created_at ASC.  Each row is expected to have:
 *        - step_label  VARCHAR  (must match one of TIMELINE_STEPS exactly, or
 *                               we try to match by status name)
 *        - occurred_at DATETIME
 *        - note        VARCHAR  (optional)
 *   2. For every canonical step, mark it done/active based on whether a
 *      matching row exists in the DB timeline.
 *   3. If the DB timeline is empty (legacy orders), fall back to the old
 *      offset-based derivation from created_at + status.
 *
 * Also attaches tracking_number and estimated_delivery to the result so the
 * front-end can display them alongside the stepper.
 */
function build_tracking(PDO $pdo, array $order): array {
    $orderId   = (int) $order['order_id'];
    $statusRaw = strtolower($order['status']);
    $created   = $order['created_at'];

    // ── 1. Try to load real timeline rows ────────────────────────────────────
    $dbRows = [];
    try {
        $stmt = $pdo->prepare(
            'SELECT step_label, occurred_at, note
             FROM order_timeline
             WHERE order_id = :oid
             ORDER BY occurred_at ASC, timeline_id ASC'
        );
        $stmt->execute([':oid' => $orderId]);
        $dbRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $ignored) {
        $dbRows = [];
    }

    // Build a lookup: normalised label → occurred_at
    $dbDone = [];
    foreach ($dbRows as $row) {
        $key = strtolower(trim($row['step_label']));
        $dbDone[$key] = $row['occurred_at'];
    }

    $useDB = !empty($dbDone);

    // ── 2. Build stepper array ────────────────────────────────────────────────
    if ($useDB) {
        // DB-driven: a step is done if its normalised label exists in $dbDone
        $lastDoneIdx = -1;
        $stepDoneFlags = [];
        foreach (TIMELINE_STEPS as $i => $label) {
            $key = strtolower($label);
            $done = isset($dbDone[$key]);
            $stepDoneFlags[$i] = $done;
            if ($done) $lastDoneIdx = $i;
        }

        $timeline = [];
        foreach (TIMELINE_STEPS as $i => $label) {
            $done     = $stepDoneFlags[$i];
            $isActive = ($i === $lastDoneIdx) && ($statusRaw !== 'delivered');
            $dateStr  = '—';

            if ($done) {
                $key     = strtolower($label);
                $dateStr = format_date($dbDone[$key]);
            }

            $step = [
                'label' => $label,
                'date'  => $dateStr,
                'done'  => $done,
            ];
            if ($isActive) {
                $step['active'] = true;
            }
            $timeline[] = $step;
        }
    } else {
        // ── Fallback: derive from status + created_at offsets ────────────────
        $doneCount = STATUS_DONE_MAP[$statusRaw] ?? 1;
        $offsets   = [0, 0, 1, 2, 3]; // days after created_at

        $timeline = [];
        foreach (TIMELINE_STEPS as $i => $label) {
            $stepDone = ($i + 1) <= $doneCount;
            $isActive = ($i + 1) === $doneCount && $statusRaw !== 'delivered';

            $dateStr = '—';
            if ($stepDone && $created) {
                $ts      = strtotime($created) + ($offsets[$i] * 86400);
                $dateStr = date('F d, Y', $ts);
            }

            $step = [
                'label' => $label,
                'date'  => $dateStr,
                'done'  => $stepDone,
            ];
            if ($isActive) {
                $step['active'] = true;
            }
            $timeline[] = $step;
        }
    }

    // ── 3. Attach tracking metadata ───────────────────────────────────────────
    $trackingNumber    = $order['tracking_number']    ?? null;
    $estimatedDelivery = $order['estimated_delivery'] ?? null;

    return [
        'steps'              => $timeline,
        'tracking_number'    => $trackingNumber ?: null,
        'estimated_delivery' => $estimatedDelivery
                                    ? format_date($estimatedDelivery)
                                    : null,
    ];
}

// ── Fetch product info for an order item ─────────────────────────────────────
function get_product_info(PDO $pdo, int $product_id): array {
    static $cache = [];
    if (isset($cache[$product_id])) return $cache[$product_id];

    $stmt = $pdo->prepare(
        'SELECT p.name,
                COALESCE(
                    (SELECT pi.image_url
                     FROM product_images pi
                     WHERE pi.product_id = p.product_id
                     ORDER BY pi.image_id ASC
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
    $orderId     = (int) $order['order_id'];
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
            'color' => '',
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

    $paymentMap = ['card' => 'Credit / Debit Card', 'gcash' => 'GCash', 'cod' => 'Cash on Delivery'];
    $paymentDisplay = $paymentMap[strtolower($order['payment_method'] ?? '')] ?? ucfirst($order['payment_method'] ?? '');

    return [
        'id'        => $order['order_number'],
        'date'      => format_date($order['created_at']),
        'dateISO'   => $order['created_at'] ? date('Y-m-d', strtotime($order['created_at'])) : '',
        'status'    => $statusDisplay,
        'total'     => format_price($grandTotal),
        'totalNum'  => $grandTotal,
        'items'     => $items,
        'payment'   => $paymentDisplay,
        'shipping'  => [
            'address' => $addrStr,
            'cost'    => $shippingFee,
        ],
        'tracking'  => build_tracking($pdo, $order),
    ];
}

// ── Base query — now includes tracking_number and estimated_delivery ──────────
$BASE_SQL =
    'SELECT o.order_id, o.order_number, o.status, o.subtotal,
            o.shipping_fee, o.discount, o.grand_total,
            o.payment_method, o.created_at,
            o.tracking_number, o.estimated_delivery,
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