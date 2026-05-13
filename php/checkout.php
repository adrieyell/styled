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

// ── Email helper (PHPMailer) ──────────────────────────────────────────────────
require_once __DIR__ . '/config/smtp.php';
$_mailerAvailable = file_exists(__DIR__ . '/../vendor/autoload.php');
if ($_mailerAvailable) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

function send_order_confirmation(
    string $toEmail,
    string $toName,
    string $orderNumber,
    array  $items,
    PDO    $pdo,
    float  $subtotal,
    float  $shippingFee,
    float  $grandTotal,
    string $paymentMethod,
    array  $shippingAddress
): void {
    // Build items HTML rows
    $itemsHtml = '';
    foreach ($items as $item) {
        // Get product name from DB
        $stmt = $pdo->prepare('SELECT name FROM products WHERE product_id = :pid LIMIT 1');
        $stmt->execute([':pid' => $item['product_id']]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        $name    = $product ? htmlspecialchars($product['name']) : 'Product #' . $item['product_id'];
        $size    = $item['size'] ? ' (' . htmlspecialchars($item['size']) . ')' : '';
        $lineTotal = '₱' . number_format($item['unit_price'] * $item['qty'], 2);
        $unitPrice = '₱' . number_format($item['unit_price'], 2);

        $itemsHtml .= "
        <tr>
            <td style='padding:10px 8px;border-bottom:1px solid #f0ebe5;'>{$name}{$size}</td>
            <td style='padding:10px 8px;border-bottom:1px solid #f0ebe5;text-align:center;'>{$item['qty']}</td>
            <td style='padding:10px 8px;border-bottom:1px solid #f0ebe5;text-align:right;'>{$unitPrice}</td>
            <td style='padding:10px 8px;border-bottom:1px solid #f0ebe5;text-align:right;'>{$lineTotal}</td>
        </tr>";
    }

    $shippingDisplay = $shippingFee === 0.0 ? 'FREE' : '₱' . number_format($shippingFee, 2);
    $subtotalDisplay = '₱' . number_format($subtotal, 2);
    $grandDisplay    = '₱' . number_format($grandTotal, 2);
    $paymentMap     = ['card' => 'Credit / Debit Card', 'gcash' => 'GCash', 'cod' => 'Cash on Delivery'];
    $paymentDisplay = $paymentMap[strtolower($paymentMethod)] ?? ucfirst($paymentMethod);

    $addrLine = implode(', ', array_filter([
        $shippingAddress['street'] ?? '',
        $shippingAddress['city']   ?? '',
        $shippingAddress['province'] ?? '',
        $shippingAddress['zip_code'] ?? '',
    ]));

    $firstName = htmlspecialchars($toName);

    $html = <<<HTML
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background:#faf7f4;font-family:'Jost',Arial,sans-serif;color:#2c1f14;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f4;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">

            <!-- Header -->
            <tr>
              <td style="background:#2c1f14;padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#e8ddd4;font-size:28px;font-weight:300;letter-spacing:4px;">STYLED</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 8px;font-size:22px;font-weight:400;">Order Confirmed!</h2>
                <p style="margin:0 0 24px;color:#7a6a5a;font-size:14px;">Hi {$firstName}, thank you for shopping with Styled. We've received your order and will begin processing it shortly.</p>

                <div style="background:#faf7f4;border-radius:6px;padding:16px 20px;margin-bottom:28px;">
                  <p style="margin:0;font-size:13px;color:#7a6a5a;">Order Number</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:500;letter-spacing:1px;">{$orderNumber}</p>
                </div>

                <!-- Items table -->
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:20px;">
                  <thead>
                    <tr style="background:#faf7f4;">
                      <th style="padding:10px 8px;text-align:left;font-weight:500;color:#7a6a5a;">Item</th>
                      <th style="padding:10px 8px;text-align:center;font-weight:500;color:#7a6a5a;">Qty</th>
                      <th style="padding:10px 8px;text-align:right;font-weight:500;color:#7a6a5a;">Unit Price</th>
                      <th style="padding:10px 8px;text-align:right;font-weight:500;color:#7a6a5a;">Total</th>
                    </tr>
                  </thead>
                  <tbody>{$itemsHtml}</tbody>
                </table>

                <!-- Totals -->
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:28px;">
                  <tr>
                    <td style="padding:6px 8px;color:#7a6a5a;">Subtotal</td>
                    <td style="padding:6px 8px;text-align:right;">{$subtotalDisplay}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 8px;color:#7a6a5a;">Shipping</td>
                    <td style="padding:6px 8px;text-align:right;">{$shippingDisplay}</td>
                  </tr>
                  <tr style="border-top:2px solid #f0ebe5;">
                    <td style="padding:10px 8px;font-weight:600;font-size:15px;">Total</td>
                    <td style="padding:10px 8px;text-align:right;font-weight:600;font-size:15px;">{$grandDisplay}</td>
                  </tr>
                </table>

                <!-- Details row -->
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:32px;">
                  <tr>
                    <td width="50%" style="vertical-align:top;padding-right:16px;">
                      <p style="margin:0 0 6px;font-weight:500;color:#7a6a5a;text-transform:uppercase;font-size:11px;letter-spacing:1px;">Shipping To</p>
                      <p style="margin:0;line-height:1.6;">{$addrLine}<br>Philippines</p>
                    </td>
                    <td width="50%" style="vertical-align:top;">
                      <p style="margin:0 0 6px;font-weight:500;color:#7a6a5a;text-transform:uppercase;font-size:11px;letter-spacing:1px;">Payment Method</p>
                      <p style="margin:0;">{$paymentDisplay}</p>
                    </td>
                  </tr>
                </table>

                <a href="https://styled.com/orders.html?order={$orderNumber}" style="display:inline-block;background:#2c1f14;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:13px;letter-spacing:1px;">Track Your Order</a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#faf7f4;padding:24px 40px;text-align:center;border-top:1px solid #f0ebe5;">
                <p style="margin:0;font-size:12px;color:#a89a8a;">Questions? Reply to this email or visit our <a href="https://styled.com/contact.html" style="color:#2c1f14;">Help Centre</a>.</p>
                <p style="margin:8px 0 0;font-size:11px;color:#c4b8ae;">© Styled Philippines</p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    HTML;

    global $_mailerAvailable;
    if (!$_mailerAvailable) {
        error_log('PHPMailer not installed - skipping confirmation email for ' . $orderNumber);
        return;
    }

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = SMTP_PORT;

    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addAddress($toEmail, $toName);
    $mail->addReplyTo(SMTP_USER, SMTP_FROM_NAME);

    $mail->isHTML(true);
    $mail->Subject = "Your Styled Order {$orderNumber} is Confirmed!";
    $mail->Body    = $html;
    $mail->AltBody = "Hi {$toName}, your order {$orderNumber} has been confirmed. Total: {$grandDisplay}. Payment: {$paymentDisplay}. Ship to: {$addrLine}.";

    $mail->send();
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

    // ── 12. Send confirmation email ───────────────────────────────────────────
    // Fetch the customer's email and name for the confirmation
    $user_stmt = $pdo->prepare('SELECT email, full_name FROM users WHERE user_id = :uid LIMIT 1');
    $user_stmt->execute([':uid' => $user_id]);
    $user_row = $user_stmt->fetch(PDO::FETCH_ASSOC);

    if ($user_row) {
        try {
            send_order_confirmation(
                $user_row['email'],
                explode(' ', $user_row['full_name'])[0] ?? 'Valued Customer',
                $order_number,
                $validated_items,
                $pdo,
                $subtotal,
                $shipping_fee,
                $grand_total,
                $payment_method,
                $shipping_address
            );
        } catch (Throwable $mailErr) {
            // Don't fail the order if email fails — just log it
            error_log('Order confirmation email failed: ' . $mailErr->getMessage());
        }
    }

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