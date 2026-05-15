<?php
require_once '../php/config.php'; // adjust to your actual config path

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function json_error(string $msg, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

function json_ok(mixed $data): never {
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

$method     = $_SERVER['REQUEST_METHOD'];
$product_id = isset($_GET['id']) ? (int)$_GET['id'] : null;

// ── GET /products.php?id=X  →  single product with full images gallery ────────
if ($method === 'GET' && $product_id) {
    $stmt = $db->prepare(
        "SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM   products p
         JOIN   categories c ON c.category_id = p.category_id
         WHERE  p.product_id = ? AND p.is_active = 1 AND p.status = 'active'"
    );
    $stmt->bind_param('i', $product_id);
    $stmt->execute();
    $product = $stmt->get_result()->fetch_assoc();
    if (!$product) json_error('Product not found.', 404);

    // All images (primary first)
    $stmt2 = $db->prepare(
        "SELECT image_id, image_url, is_primary
         FROM   product_images
         WHERE  product_id = ?
         ORDER  BY is_primary DESC, image_id ASC"
    );
    $stmt2->bind_param('i', $product_id);
    $stmt2->execute();
    $images = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);

    $product['images']        = $images;
    // Convenience fields used by the legacy frontend
    $product['primary_image'] = $images[0]['image_url'] ?? null;
    $product['image_urls']    = array_column($images, 'image_url');

    // Sizes / stock
    $stmt3 = $db->prepare(
        "SELECT size, stock_qty, sku
         FROM   product_sizes
         WHERE  product_id = ?
         ORDER  BY FIELD(size,'XS','S','M','L','XL','XXL')"
    );
    $stmt3->bind_param('i', $product_id);
    $stmt3->execute();
    $product['sizes'] = $stmt3->get_result()->fetch_all(MYSQLI_ASSOC);

    json_ok($product);
}

// ── GET /products.php  →  product listing with primary image + image count ────
if ($method === 'GET') {
    $where  = ["p.is_active = 1", "p.status = 'active'"];
    $params = [];
    $types  = '';

    if (!empty($_GET['category'])) {
        $where[]  = 'c.slug = ?';
        $params[] = $_GET['category'];
        $types   .= 's';
    }
    if (!empty($_GET['search'])) {
        $where[]  = 'p.name LIKE ?';
        $params[] = '%' . $db->real_escape_string($_GET['search']) . '%';
        $types   .= 's';
    }
    if (!empty($_GET['min_price'])) {
        $where[]  = 'COALESCE(p.sale_price, p.price) >= ?';
        $params[] = (float)$_GET['min_price'];
        $types   .= 'd';
    }
    if (!empty($_GET['max_price'])) {
        $where[]  = 'COALESCE(p.sale_price, p.price) <= ?';
        $params[] = (float)$_GET['max_price'];
        $types   .= 'd';
    }

    $limit  = min((int)($_GET['limit'] ?? 20), 100);
    $offset = (int)($_GET['offset']    ?? 0);

    $sql = "SELECT p.*,
                   c.name AS category_name,
                   c.slug AS category_slug,
                   pi.image_url AS primary_image,
                   (SELECT COUNT(*) FROM product_images WHERE product_id = p.product_id) AS image_count
            FROM   products p
            JOIN   categories c ON c.category_id = p.category_id
            LEFT JOIN product_images pi ON pi.product_id = p.product_id AND pi.is_primary = 1
            WHERE  " . implode(' AND ', $where) . "
            ORDER  BY p.created_at DESC
            LIMIT  ? OFFSET ?";

    $params[] = $limit;
    $params[] = $offset;
    $types   .= 'ii';

    $stmt = $db->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $products = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Total count for pagination
    $count_sql = "SELECT COUNT(*) AS total
                  FROM   products p
                  JOIN   categories c ON c.category_id = p.category_id
                  WHERE  " . implode(' AND ', $where);
    // Remove the last two params (limit/offset) for count query
    $count_params = array_slice($params, 0, -2);
    $count_types  = substr($types, 0, -2);
    $cstmt = $db->prepare($count_sql);
    if ($count_types) {
        $cstmt->bind_param($count_types, ...$count_params);
    }
    $cstmt->execute();
    $total = $cstmt->get_result()->fetch_assoc()['total'];

    json_ok([
        'products' => $products,
        'total'    => (int)$total,
        'limit'    => $limit,
        'offset'   => $offset,
    ]);
}

json_error('Method not allowed.', 405);