<?php
// ============================================
// ANALYTICS API — php/admin/analytics.php
// GET — Admin only
// ============================================

header('Content-Type: application/json');
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/../db.php';

requireAuth('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$pdo = getPDO();

// ── Total revenue (delivered + shipped orders, not cancelled/refunded) ────────
// FIXED: changed total_amount to grand_total
$rev = $pdo->query("
    SELECT
        COALESCE(SUM(grand_total), 0)  AS total_revenue,
        COUNT(*)                         AS total_orders,
        COALESCE(AVG(grand_total), 0)  AS avg_order_value
    FROM orders
    WHERE status NOT IN ('cancelled', 'refunded')
")->fetch();

// ── Revenue by day (last 14 days) ─────────────────────────────────────────────
// FIXED: changed total_amount to grand_total
$revByDay = $pdo->query("
    SELECT
        DATE(created_at)            AS date,
        SUM(grand_total)           AS revenue
    FROM orders
    WHERE status NOT IN ('cancelled', 'refunded')
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
")->fetchAll();

// ── Orders by status ──────────────────────────────────────────────────────────
$byStatus = $pdo->query("
    SELECT status, COUNT(*) AS cnt
    FROM orders
    GROUP BY status
")->fetchAll();

$ordersByStatus = [
    'pending'    => 0,
    'processing' => 0,
    'shipped'    => 0,
    'delivered'  => 0,
    'cancelled'  => 0,
    'refunded'   => 0,
];
foreach ($byStatus as $row) {
    $key = strtolower($row['status']);
    if (isset($ordersByStatus[$key])) {
        $ordersByStatus[$key] = (int) $row['cnt'];
    }
}

// ── Sales by category ─────────────────────────────────────────────────────────
$catSales = $pdo->query("
    SELECT
        c.name                         AS category,
        SUM(oi.qty)                    AS qty_sold
    FROM order_items oi
    JOIN products p  ON p.product_id = oi.product_id
    JOIN categories c ON c.category_id = p.category_id
    JOIN orders o     ON o.order_id = oi.order_id
    WHERE o.status NOT IN ('cancelled', 'refunded')
    GROUP BY c.category_id, c.name
    ORDER BY qty_sold DESC
")->fetchAll();

$totalQty = array_sum(array_column($catSales, 'qty_sold')) ?: 1;
$salesByCategory = array_map(fn($r) => [
    'category'   => $r['category'],
    'percentage' => round(($r['qty_sold'] / $totalQty) * 100),
], $catSales);

// ── Top products ──────────────────────────────────────────────────────────────
// FIXED: changed total_amount to grand_total in revenue calculation
$topProducts = $pdo->query("
    SELECT
        p.product_id,
        p.name,
        SUM(oi.qty)                         AS quantity_sold,
        SUM(oi.qty * oi.unit_price)         AS revenue
    FROM order_items oi
    JOIN products p ON p.product_id = oi.product_id
    JOIN orders o   ON o.order_id = oi.order_id
    WHERE o.status NOT IN ('cancelled', 'refunded')
    GROUP BY p.product_id, p.name
    ORDER BY quantity_sold DESC
    LIMIT 10
")->fetchAll();

// ── Conversion rate (orders / total users × 100) ─────────────────────────────
$totalUsers = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'customer'")->fetchColumn();
$convRate   = $totalUsers > 0
    ? round(((int) $rev['total_orders'] / $totalUsers) * 100, 2)
    : 0;

echo json_encode([
    'total_revenue'      => (float) $rev['total_revenue'],
    'total_orders'       => (int)   $rev['total_orders'],
    'avg_order_value'    => (float) $rev['avg_order_value'],
    'conversion_rate'    => $convRate,
    'revenue_by_day'     => $revByDay,
    'orders_by_status'   => $ordersByStatus,
    'sales_by_category'  => $salesByCategory,
    'top_products'       => $topProducts,
]);
?>