<?php
// ============================================
// PROMOTIONS API — php/admin/promotions.php
// GET                  → list all (admin only)
// POST {fields}        → create (admin only)
// PUT  ?id=1 {fields}  → toggle active / update (admin only)
// DELETE ?id=1         → delete (admin only)
// ============================================

header('Content-Type: application/json');
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    requireAuth();  // staff and admin can view promotions
} else {
    requireAuth('admin'); // only admin can create/update/delete
}
$pdo = getPDO();

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $rows = $pdo->query("SELECT * FROM promotions ORDER BY created_at DESC")->fetchAll();
    echo json_encode(['success' => true, 'promotions' => $rows]);
    exit;
}

// ── POST: Create ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    foreach (['code', 'discount_type', 'discount_value'] as $f) {
        if (empty($body[$f])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Missing field: $f"]);
            exit;
        }
    }

    $code = strtoupper(trim($body['code']));

    // Duplicate check
    $chk = $pdo->prepare("SELECT promo_id FROM promotions WHERE code = ?");
    $chk->execute([$code]);
    if ($chk->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Promo code already exists.']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO promotions
            (code, discount_type, discount_value, min_order, usage_limit, usage_count, is_active, expiry_date)
        VALUES
            (:code, :discount_type, :discount_value, :min_order, :usage_limit, 0, :is_active, :expiry_date)
    ");
    $stmt->execute([
        ':code'           => $code,
        ':discount_type'  => $body['discount_type'],
        ':discount_value' => (float) $body['discount_value'],
        ':min_order'      => (float) ($body['min_order']   ?? 0),
        ':usage_limit'    => isset($body['usage_limit']) ? (int) $body['usage_limit'] : null,
        ':is_active'      => isset($body['is_active'])   ? (int) $body['is_active']  : 1,
        ':expiry_date'    => $body['expiry_date'] ?? null,
    ]);

    echo json_encode(['success' => true, 'promo_id' => (int) $pdo->lastInsertId()]);
    exit;
}

// ── PUT: Update / toggle ──────────────────────────────────────────────────────
if ($method === 'PUT') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing promo id.']);
        exit;
    }

    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $fields = [];
    $params = [];

    $allowed = ['code', 'discount_type', 'discount_value', 'min_order', 'usage_limit', 'is_active', 'expiry_date'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) {
            $fields[] = "$f = ?";
            $params[] = $f === 'code' ? strtoupper(trim($body[$f])) : $body[$f];
        }
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Nothing to update.']);
        exit;
    }

    $params[] = $id;
    $pdo->prepare("UPDATE promotions SET " . implode(', ', $fields) . " WHERE promo_id = ?")->execute($params);

    echo json_encode(['success' => true]);
    exit;
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing promo id.']);
        exit;
    }

    $pdo->prepare("DELETE FROM promotions WHERE promo_id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);