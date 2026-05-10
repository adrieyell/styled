<?php
// ============================================
// PRODUCTS API — php/products.php
// ============================================
// GET params: category (slug), min_price, max_price, search
// Returns JSON matching the CATEGORIES structure in main.js

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

require_once __DIR__ . '/db.php';

$pdo = getPDO();

// ── 1. Read & sanitise query params ──────────────────────────────────────────
$category_slug = trim($_GET['category'] ?? '');
$min_price     = isset($_GET['min_price']) && is_numeric($_GET['min_price'])
                    ? (float) $_GET['min_price'] : null;
$max_price     = isset($_GET['max_price']) && is_numeric($_GET['max_price'])
                    ? (float) $_GET['max_price'] : null;
$search        = trim($_GET['search'] ?? '');

// ── 2. Build dynamic WHERE clause ────────────────────────────────────────────
$where  = ['p.is_active = 1'];
$params = [];

if ($category_slug !== '') {
    $where[]  = 'c.slug = ?';
    $params[] = $category_slug;
}

if ($min_price !== null) {
    $where[]  = 'p.price >= ?';
    $params[] = $min_price;
}

if ($max_price !== null) {
    $where[]  = 'p.price <= ?';
    $params[] = $max_price;
}

if ($search !== '') {
    $where[]  = '(p.name LIKE ? OR p.description LIKE ?)';
    $like     = '%' . $search . '%';
    $params[] = $like;
    $params[] = $like;
}

$whereSQL = 'WHERE ' . implode(' AND ', $where);

// ── 3. Fetch products (with category join) ────────────────────────────────────
$sql = "
    SELECT
        p.product_id,
        p.name,
        p.description,
        p.price,
        p.image_path,
        c.slug        AS category,
        c.name        AS category_name
    FROM products p
    JOIN categories c ON p.category_id = c.category_id
    $whereSQL
    ORDER BY p.product_id ASC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

// ── 4. Fetch sizes & stock for those products ─────────────────────────────────
if (empty($rows)) {
    echo json_encode(['products' => []]);
    exit;
}

$productIds   = array_column($rows, 'product_id');
$placeholders = implode(',', array_fill(0, count($productIds), '?'));

$sizeSql  = "
    SELECT product_id, size_label, stock_qty
    FROM product_sizes
    WHERE product_id IN ($placeholders)
    ORDER BY FIELD(size_label, 'XS', 'S', 'M', 'L', 'XL', 'XXL')
";
$sizeStmt = $pdo->prepare($sizeSql);
$sizeStmt->execute($productIds);
$sizeRows = $sizeStmt->fetchAll();

// Group sizes and stock by product_id
$sizeMap  = [];  // product_id => ['S','M','L', …]
$stockMap = [];  // product_id => ['S' => 10, 'M' => 15, …]

foreach ($sizeRows as $sr) {
    $pid = (int) $sr['product_id'];
    $sizeMap[$pid][]              = $sr['size_label'];
    $stockMap[$pid][$sr['size_label']] = (int) $sr['stock_qty'];
}

// ── 5. Category colour map (matches main.js CATEGORIES) ──────────────────────
// These are the accent colours shown in the product modal colour picker.
// Update here if you add new categories to the DB.
$categoryColors = [
    'tops'        => ['#6b3a2a', '#1c1c1c', '#c9b99a'],
    'bottoms'     => ['#3d2b1f', '#8c6d57', '#e8ddd0'],
    'dresses'     => ['#5c3d2e', '#c9b99a', '#1e1510'],
    'outerwear'   => ['#2c1f14', '#7a6a5a', '#c9b99a'],
    'accessories' => ['#8c6d57', '#2c1f14', '#f5f0ea'],
];

// ── 6. Assemble response ──────────────────────────────────────────────────────
$products = [];

foreach ($rows as $row) {
    $pid      = (int) $row['product_id'];
    $slug     = $row['category'];
    $priceNum = (float) $row['price'];

    // Build image path — use DB value if set, otherwise derive from product name
    // matching the Assets/Images/<Category>/<Product Name>.png convention in main.js
    if (!empty($row['image_path'])) {
        $imagePath = $row['image_path'];
    } else {
        $catFolder = ucfirst(strtolower($slug));
        $imagePath = 'Assets/Images/' . $catFolder . '/' . $row['name'] . '.png';
    }

    $products[] = [
        'product_id'    => $pid,
        'name'          => $row['name'],
        'description'   => $row['description'] ?? '',
        'price'         => '₱' . number_format($priceNum, 2),
        'price_num'     => $priceNum,
        'category'      => $slug,
        'category_name' => $row['category_name'],
        'image'         => $imagePath,
        // Fallback to default sizes if none stored yet
        'sizes'         => $sizeMap[$pid]  ?? ['XS', 'S', 'M', 'L', 'XL'],
        'colors'        => $categoryColors[$slug] ?? ['#2c1f14', '#7a6a5a', '#c9b99a'],
        'stock'         => $stockMap[$pid] ?? (object)[],
    ];
}

echo json_encode(['products' => $products], JSON_UNESCAPED_UNICODE);