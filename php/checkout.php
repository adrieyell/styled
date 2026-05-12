<?php
// ============================================
// CHECKOUT API  -  php/checkout.php
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

// ── Only accept POST ──────────────────────────────────────────────────────────
if ($method !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Helper: read raw JSON body ────────────────────────────────────────────────
function get_json_body(): array {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// ── Helper: generate unique order number (STY-YYYYMMDD-XXXX) ─────────────────
function generate_order_number(PDO $pdo): string {
    $date = date('Ymd');
    do {
        $rand        = str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);
        $order_number = "STY-{$date}-{$rand}";
        $stmt = $pdo->prepare('SELECT 1 FROM orders WHERE order_number = :on');
        $stmt->execute([':on' => $order_number]);
    } while ($stmt->fetch()); // retry on the rare collision
    return $order_number;
}

try {
    $pdo  = getPDO();
    $body = get_json_body();

    // ── 1. Validate required top-level keys ───────────────────────────────────
    $items           = $body['items']            ?? [];
    $shipping_address = $body['shipping_address'] ?? [];
    $payment_method  = trim($body['payment_method'] ?? '');
    $promo_code      = trim($body['promo_code']     ?? '');

    if (empty($items) || !is_array($items)) {
        ob_end_clean();
        http_response_code(400);
        echo json_encode(['error' => 'items array is required and must not be empty']);
        exit;
    }

    $required_address = ['street', 'city', 'province', 'zip_code'];
    foreach ($required_address as $key) {
        if (empty($shipping_address[$key])) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode(['error' => "shipping_address.$key is required"]);
            exit;
        }
    }

    if ($payment_method === '') {
        ob_end_clean();
        http_response_code(400);
        echo json_encode(['error' => 'payment_method is required']);
        exit;
    }

    // ── 2. Validate & normalise items ─────────────────────────────────────────
    $validated_items = [];
    foreach ($items as $item) {
        $product_id = isset($item['product_id']) ? (int) $item['product_id'] : 0;
        $qty        = isset($item['qty'])        ? (int) $item['qty']        : 0;
        $unit_price = isset($item['unit_price']) ? (float) $item['unit_price'] : 0.0;
        $size       = trim($item['size'] ?? '');

        if ($product_id <= 0 || $qty <= 0 || $unit_price <= 0) {
            ob_end_clean();
            http_response_code(400);
            echo json_encode(['error' => 'Each item must have valid product_id, qty, and unit_price']);
            exit;
        }

        $validated_items[] = [
            'product_id' => $product_id,
            'size'       => $size,
            'qty'        => $qty,
            'unit_price' => $unit_price,
        ];
    }

    // ── 3. Calculate totals ───────────────────────────────────────────────────
    $subtotal = 0.0;
    foreach ($validated_items as $item) {
        $subtotal += $item['unit_price'] * $item['qty'];
    }

    $shipping_fee = $subtotal >= 1000 ? 0.0 : 150.0;
    $grand_total  = round($subtotal + $shipping_fee, 2);

    // ── 4. Start transaction ──────────────────────────────────────────────────
    $pdo->beginTransaction();

    // ── 5. Create or get address ──────────────────────────────────────────────
    $street   = trim($shipping_address['street']);
    $city     = trim($shipping_address['city']);
    $province = trim($shipping_address['province']);
    $zip_code = trim($shipping_address['zip_code']);

    $addr_check = $pdo->prepare(
        'SELECT address_id FROM addresses
         WHERE user_id = :uid
           AND street   = :street
           AND city     = :city
           AND province = :province
           AND zip_code = :zip
         LIMIT 1'
    );
    $addr_check->execute([
        ':uid'      => $user_id,
        ':street'   => $street,
        ':city'     => $city,
        ':province' => $province,
        ':zip'      => $zip_code,
    ]);
    $existing_addr = $addr_check->fetch(PDO::FETCH_ASSOC);

    if ($existing_addr) {
        $address_id = (int) $existing_addr['address_id'];
    } else {
        $ins_addr = $pdo->prepare(
            'INSERT INTO addresses (user_id, label, street, city, province, zip_code, is_default)
             VALUES (:uid, :label, :street, :city, :province, :zip, 0)'
        );
        $ins_addr->execute([
            ':uid'      => $user_id,
            ':label'    => 'Shipping',   // default label for checkout-created addresses
            ':street'   => $street,
            ':city'     => $city,
            ':province' => $province,
            ':zip'      => $zip_code,
        ]);
        $address_id = (int) $pdo->lastInsertId();
    }

    // ── 6. Generate unique order number ──────────────────────────────────────
    $order_number = generate_order_number($pdo);

    // ── 7. Resolve promo_id (if a promo code was supplied) ───────────────────
    $promo_id = null;
    if ($promo_code !== '') {
        $promo_stmt = $pdo->prepare(
            'SELECT promo_id FROM promotions WHERE code = :code LIMIT 1'
        );
        $promo_stmt->execute([':code' => $promo_code]);
        $promo_row = $promo_stmt->fetch(PDO::FETCH_ASSOC);
        if ($promo_row) {
            $promo_id = (int) $promo_row['promo_id'];
        }
    }

    // ── 8. Insert into orders ─────────────────────────────────────────────────
    $ins_order = $pdo->prepare(
        'INSERT INTO orders
             (user_id, address_id, order_number, subtotal, shipping_fee,
              discount, grand_total, payment_method, promo_id, status)
         VALUES
             (:uid, :addr_id, :order_number, :subtotal, :shipping_fee,
              :discount, :grand_total, :payment_method, :promo_id, "pending")'
    );
    $ins_order->execute([
        ':uid'            => $user_id,
        ':addr_id'        => $address_id,
        ':order_number'   => $order_number,
        ':subtotal'       => round($subtotal, 2),
        ':shipping_fee'   => $shipping_fee,
        ':discount'       => 0.00,   // promo discount logic can be added here later
        ':grand_total'    => $grand_total,
        ':payment_method' => $payment_method,
        ':promo_id'       => $promo_id,
    ]);
    $order_id = (int) $pdo->lastInsertId();

    // ── 9. Insert order items ─────────────────────────────────────────────────
    $ins_item = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, size, qty, unit_price)
         VALUES (:order_id, :product_id, :size, :qty, :unit_price)'
    );
    foreach ($validated_items as $item) {
        $ins_item->execute([
            ':order_id'   => $order_id,
            ':product_id' => $item['product_id'],
            ':size'       => $item['size'],
            ':qty'        => $item['qty'],
            ':unit_price' => $item['unit_price'],
        ]);
    }

    // ── 10. Clear the user's cart ─────────────────────────────────────────────
    $del_cart = $pdo->prepare('DELETE FROM cart WHERE user_id = :uid');
    $del_cart->execute([':uid' => $user_id]);

    // ── 11. Commit ────────────────────────────────────────────────────────────
    $pdo->commit();

    ob_end_clean();
    echo json_encode([
        'success'      => true,
        'order_id'     => $order_id,
        'order_number' => $order_number,
        'grand_total'  => $grand_total,
    ]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'detail' => $e->getMessage()]);
}