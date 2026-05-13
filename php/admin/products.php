<?php
// ============================================
// PRODUCTS API — php/admin/products.php
// FIXED: Removed 'color' column (doesn't exist)
// ============================================

header('Content-Type: application/json');
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/../db.php';

$user   = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$pdo    = getPDO();

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {

    // Single product
    if (!empty($_GET['id'])) {
        $stmt = $pdo->prepare("
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON c.category_id = p.category_id
            WHERE p.product_id = ?
        ");
        $stmt->execute([(int) $_GET['id']]);
        $product = $stmt->fetch();

        if (!$product) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Product not found.']);
            exit;
        }

        // Sizes + stock
        $sizes = $pdo->prepare("SELECT * FROM product_sizes WHERE product_id = ?");
        $sizes->execute([$product['product_id']]);
        $product['sizes'] = $sizes->fetchAll();

        // Images
        $imgs = $pdo->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC");
        $imgs->execute([$product['product_id']]);
        $product['images'] = $imgs->fetchAll();

        echo json_encode(['success' => true, 'product' => $product]);
        exit;
    }

    // List
    $page     = max(1, (int) ($_GET['page']     ?? 1));
    $limit    = min(50, max(1, (int) ($_GET['limit'] ?? 8)));
    $offset   = ($page - 1) * $limit;
    $category = $_GET['category'] ?? '';
    $search   = $_GET['search']   ?? '';

    $where  = [];
    $params = [];

    if ($category) {
        $where[]  = 'c.name = ?';
        $params[] = $category;
    }
    if ($search) {
        $where[]  = 'p.name LIKE ?';
        $params[] = "%$search%";
    }

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $totalStmt = $pdo->prepare("
        SELECT COUNT(*) FROM products p
        LEFT JOIN categories c ON c.category_id = p.category_id
        $whereSQL
    ");
    $totalStmt->execute($params);
    $totalCount = (int) $totalStmt->fetchColumn();

    // REMOVED: p.color (doesn't exist in your table)
    $stmt = $pdo->prepare("
        SELECT p.product_id, p.name, p.price,
               c.name AS category,
               COALESCE(SUM(ps.stock_qty), 0) AS stock
        FROM products p
        LEFT JOIN categories   c  ON c.category_id = p.category_id
        LEFT JOIN product_sizes ps ON ps.product_id = p.product_id
        $whereSQL
        GROUP BY p.product_id
        ORDER BY p.created_at DESC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);
    
    $products = $stmt->fetchAll();
    
    // Add calculated status based on stock
    foreach ($products as &$product) {
        $stock = (int) $product['stock'];
        if ($stock == 0) {
            $product['status'] = 'Out of Stock';
        } elseif ($stock <= 5) {
            $product['status'] = 'Low Stock';
        } else {
            $product['status'] = 'Active';
        }
    }

    echo json_encode([
        'success'  => true,
        'products' => $products,
        'total'    => $totalCount,
        'page'     => $page,
        'pages'    => (int) ceil($totalCount / $limit),
    ]);
    exit;
}

// ── POST: Create (admin only) ─────────────────────────────────────────────────
if ($method === 'POST') {
    requireAuth('admin');

    $name        = trim($_POST['name']        ?? '');
    $category_id = (int) ($_POST['category_id'] ?? 0);
    $price       = (float) ($_POST['price']    ?? 0);
    $description = trim($_POST['description'] ?? '');

    if (!$name || !$category_id || !$price) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'name, category_id and price are required.']);
        exit;
    }

    // Handle image upload
    $imagePath = null;
    if (!empty($_FILES['image']['tmp_name'])) {
        $uploadDir = __DIR__ . '/../../assets/images/products/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);
        $ext       = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
        $allowed   = ['jpg', 'jpeg', 'png', 'webp'];
        if (!in_array($ext, $allowed)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid image type.']);
            exit;
        }
        $filename  = uniqid('prod_') . '.' . $ext;
        move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $filename);
        $imagePath = 'assets/images/products/' . $filename;
    }

    // REMOVED: color column
    $stmt = $pdo->prepare("
        INSERT INTO products (name, category_id, price, description, image_url, created_at)
        VALUES (:name, :category_id, :price, :description, :image_url, NOW())
    ");
    $stmt->execute([
        ':name'        => $name,
        ':category_id' => $category_id,
        ':price'       => $price,
        ':description' => $description,
        ':image_url'   => $imagePath,
    ]);

    echo json_encode(['success' => true, 'product_id' => (int) $pdo->lastInsertId()]);
    exit;
}

// ── PUT: Update (admin only) ──────────────────────────────────────────────────
if ($method === 'PUT') {
    requireAuth('admin');

    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing product id.']);
        exit;
    }

    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $fields = [];
    $params = [];

    if (isset($body['name'])) {
        $fields[] = 'name = ?';
        $params[] = $body['name'];
    }
    if (isset($body['description'])) {
        $fields[] = 'description = ?';
        $params[] = $body['description'];
    }
    if (isset($body['price'])) {
        $fields[] = 'price = ?';
        $params[] = (float) $body['price'];
    }
    if (isset($body['category_id'])) {
        $fields[] = 'category_id = ?';
        $params[] = (int) $body['category_id'];
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Nothing to update.']);
        exit;
    }

    $params[] = $id;
    $pdo->prepare("UPDATE products SET " . implode(', ', $fields) . " WHERE product_id = ?")->execute($params);

    echo json_encode(['success' => true]);
    exit;
}

// ── DELETE (admin only) ───────────────────────────────────────────────────────
if ($method === 'DELETE') {
    requireAuth('admin');

    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing product id.']);
        exit;
    }

    $pdo->prepare("DELETE FROM products WHERE product_id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>