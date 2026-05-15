<?php
// ============================================
// EMAIL FUNCTIONS - Reusable email helpers
// ============================================

require_once __DIR__ . '/config/smtp.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Send order status update email to customer
 */
function send_order_status_email($pdo, $orderId, $oldStatus, $newStatus, $trackingNumber = null)
{
    // Fetch order details
    $stmt = $pdo->prepare("
        SELECT o.order_number, o.grand_total, o.payment_method, o.created_at,
               u.email, u.full_name,
               a.street, a.city, a.province, a.zip_code
        FROM orders o
        JOIN users u ON u.user_id = o.user_id
        LEFT JOIN addresses a ON a.address_id = o.address_id
        WHERE o.order_id = ?
    ");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    if (!$order) return false;

    // Fetch order items
    $itemsStmt = $pdo->prepare("
        SELECT oi.product_id, oi.qty, oi.unit_price, oi.size, p.name AS product_name
        FROM order_items oi
        JOIN products p ON p.product_id = oi.product_id
        WHERE oi.order_id = ?
    ");
    $itemsStmt->execute([$orderId]);
    $items = $itemsStmt->fetchAll();

    $orderNumber = $order['order_number'];
    $customerName = explode(' ', $order['full_name'])[0];
    $email = $order['email'];
    
    // Calculate subtotal from items
    $subtotal = 0;
    foreach ($items as $item) {
        $subtotal += $item['unit_price'] * $item['qty'];
    }
    $shippingFee = $order['grand_total'] - $subtotal;
    $shippingFeeDisplay = $shippingFee == 0 ? 'FREE' : '₱' . number_format($shippingFee, 2);
    $grandDisplay = '₱' . number_format($order['grand_total'], 2);
    $subtotalDisplay = '₱' . number_format($subtotal, 2);
    
    $paymentMap = ['card' => 'Credit/Debit Card', 'gcash' => 'GCash', 'cod' => 'Cash on Delivery'];
    $paymentDisplay = $paymentMap[strtolower($order['payment_method'])] ?? ucfirst($order['payment_method']);

    $addrParts = array_filter([$order['street'], $order['city'], $order['province'], $order['zip_code']]);
    $address = implode(', ', $addrParts) . ', Philippines';

    $itemsHtml = '';
    foreach ($items as $item) {
        $sizeHtml = $item['size'] ? ' (' . htmlspecialchars($item['size']) . ')' : '';
        $lineTotal = $item['unit_price'] * $item['qty'];
        $itemsHtml .= "<tr>
            <td style='padding:10px 8px;border-bottom:1px solid #f0ebe5;'>{$item['product_name']}{$sizeHtml}</td>
            <td style='padding:10px 8px;border-bottom:1px solid #f0ebe5;text-align:center;'>{$item['qty']}</td>
            <td style='padding:10px 8px;border-bottom:1px solid #f0ebe5;text-align:right;'>₱" . number_format($item['unit_price'], 2) . "</td>
            <td style='padding:10px 8px;border-bottom:1px solid #f0ebe5;text-align:right;'>₱" . number_format($lineTotal, 2) . "</td>
        </tr>";
    }

    $statusText = ucfirst($newStatus);
    $trackingHtml = $trackingNumber ? "<p style='margin:12px 0 0;'><strong>Tracking Number:</strong> {$trackingNumber}</p>" : '';
    $orderLink = "http://localhost/styled/orders.html";

    // Build HTML email – use double quotes so variables are parsed
    $htmlBody = "
<!DOCTYPE html>
<html><head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#faf7f4;font-family:Jost,Arial,sans-serif;color:#2c1f14;'>
<table width='100%' cellpadding='0' cellspacing='0' style='background:#faf7f4;padding:40px 0;'>
    <tr><td align='center'>
        <table width='600' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);'>
            <tr><td style='background:#2c1f14;padding:32px 40px;text-align:center;'>
                <h1 style='margin:0;color:#e8ddd4;font-size:28px;font-weight:300;letter-spacing:4px;'>STYLED</h1>
             </td> </tr>
            <tr><td style='padding:40px;'>
                <h2 style='margin:0 0 8px;font-size:22px;font-weight:400;'>Order Status Update</h2>
                <p style='margin:0 0 24px;color:#7a6a5a;font-size:14px;'>Hi {$customerName},</p>
                <p style='margin:0 0 16px;font-size:14px;'>Your order <strong>#{$orderNumber}</strong> status has been updated to <strong style='color:#3a6b4a;'>{$statusText}</strong>.</p>
                {$trackingHtml}
                <div style='background:#faf7f4;border-radius:6px;padding:16px 20px;margin:28px 0;'>
                    <p style='margin:0;font-size:13px;color:#7a6a5a;'>Order #{$orderNumber}</p>
                    <p style='margin:4px 0 0;font-size:18px;font-weight:500;'>{$grandDisplay}</p>
                </div>
                <table width='100%' cellpadding='0' cellspacing='0' style='font-size:13px;margin-bottom:20px;'>
                    <thead><tr style='background:#faf7f4;'><th style='padding:10px 8px;text-align:left;'>Item</th><th style='padding:10px 8px;text-align:center;'>Qty</th><th style='padding:10px 8px;text-align:right;'>Unit Price</th><th style='padding:10px 8px;text-align:right;'>Total</th></tr></thead>
                    <tbody>{$itemsHtml}</tbody>
                </table>
                <table width='100%' cellpadding='0' cellspacing='0' style='font-size:13px;margin-bottom:28px;'>
                    <tr><td style='padding:6px 8px;color:#7a6a5a;'>Subtotal</td><td style='padding:6px 8px;text-align:right;'>{$subtotalDisplay}</td></tr>
                    <tr><td style='padding:6px 8px;color:#7a6a5a;'>Shipping</td><td style='padding:6px 8px;text-align:right;'>{$shippingFeeDisplay}</td></tr>
                    <tr style='border-top:2px solid #f0ebe5;'><td style='padding:10px 8px;font-weight:600;'>Total</td><td style='padding:10px 8px;text-align:right;font-weight:600;'>{$grandDisplay}</td></tr>
                </table>
                <table width='100%' cellpadding='0' cellspacing='0' style='font-size:13px;margin-bottom:32px;'>
                    <tr><td width='50%' style='vertical-align:top;padding-right:16px;'><p style='margin:0 0 6px;font-weight:500;color:#7a6a5a;text-transform:uppercase;font-size:11px;'>Shipping To</p><p style='margin:0;line-height:1.6;'>{$address}</p></td>
                    <td width='50%' style='vertical-align:top;'><p style='margin:0 0 6px;font-weight:500;color:#7a6a5a;text-transform:uppercase;font-size:11px;'>Payment Method</p><p style='margin:0;'>{$paymentDisplay}</p></td></tr>
                </table>
                <a href='{$orderLink}' style='display:inline-block;background:#2c1f14;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:13px;letter-spacing:1px;'>View Your Order</a>
             </td> </tr>
            <tr><td style='background:#faf7f4;padding:24px 40px;text-align:center;border-top:1px solid #f0ebe5;'>
                <p style='margin:0;font-size:12px;color:#a89a8a;'>Questions? Reply to this email or visit our <a href='http://localhost/styled/contact.html' style='color:#2c1f14;'>Help Centre</a>.</p>
                <p style='margin:8px 0 0;font-size:11px;color:#c4b8ae;'>© Styled Philippines</p>
             </td> </tr>
        </table>
     </td> </tr>
</table>
</body>
</html>";

    $textBody = "Hi {$customerName},\n\nYour order #{$orderNumber} status has been updated to {$statusText}.\n" .
                ($trackingNumber ? "Tracking number: {$trackingNumber}\n" : "") .
                "\nSubtotal: {$subtotalDisplay}\nShipping: {$shippingFeeDisplay}\nTotal: {$grandDisplay}\n\nView your order: {$orderLink}\n\nThank you for shopping at Styled.";

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;

        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
        $mail->addAddress($email, $order['full_name']);
        $mail->isHTML(true);
        $mail->Subject = "Your Styled order #{$orderNumber} has been {$statusText}";
        $mail->Body    = $htmlBody;
        $mail->AltBody = $textBody;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Order status email failed: " . $mail->ErrorInfo);
        return false;
    }
}

// ============================================
// STAFF INVITATION EMAIL
// ============================================

/**
 * Send invitation email to a new staff member
 */
function send_staff_invite_email($toEmail, $toName, $tempPassword, $role)
{
    $loginUrl = "http://localhost/styled/auth.html";
    $roleDisplay = ucfirst($role);
    
    $htmlBody = "
<!DOCTYPE html>
<html>
<head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#faf7f4;font-family:Jost,Arial,sans-serif;color:#2c1f14;'>
<table width='100%' cellpadding='0' cellspacing='0' style='background:#faf7f4;padding:40px 0;'>
    <tr><td align='center'>
        <table width='520' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);'>
            <tr><td style='background:#2c1f14;padding:28px 32px;text-align:center;'>
                <h1 style='margin:0;color:#e8ddd4;font-size:24px;font-weight:300;letter-spacing:4px;'>STYLED</h1>
             </td> </tr>
            <tr><td style='padding:32px;'>
                <h2 style='margin:0 0 8px;font-size:20px;font-weight:400;'>You've been invited!</h2>
                <p style='margin:0 0 20px;color:#7a6a5a;font-size:14px;'>Hello {$toName},</p>
                <p style='margin:0 0 16px;font-size:14px;'>You have been added as a <strong>{$roleDisplay}</strong> to the Styled admin dashboard.</p>
                <div style='background:#faf7f4;border-radius:6px;padding:16px 20px;margin:20px 0;'>
                    <p style='margin:0 0 8px;font-size:13px;color:#7a6a5a;'>Your login credentials:</p>
                    <p style='margin:0 0 4px;'><strong>Email:</strong> {$toEmail}</p>
                    <p style='margin:0;'><strong>Temporary Password:</strong> <code style='background:#e8e0d6;padding:2px 6px;border-radius:4px;'>{$tempPassword}</code></p>
                </div>
                <p style='margin:0 0 16px;font-size:14px;'>Use the button below to log in. You will be prompted to change your password after your first login.</p>
                <a href='{$loginUrl}' style='display:inline-block;background:#2c1f14;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:13px;letter-spacing:1px;'>Log in to Dashboard</a>
             </td> </tr>
            <tr><td style='background:#faf7f4;padding:20px 32px;text-align:center;border-top:1px solid #f0ebe5;'>
                <p style='margin:0;font-size:12px;color:#a89a8a;'>If you did not expect this invitation, please ignore this email.</p>
                <p style='margin:8px 0 0;font-size:11px;color:#c4b8ae;'>© Styled Philippines</p>
             </td> </tr>
        </table>
     </td> </tr>
</table>
</body>
</html>";

    $textBody = "Hello {$toName},\n\nYou have been invited as a {$roleDisplay} to the Styled admin dashboard.\n\nYour login credentials:\nEmail: {$toEmail}\nTemporary Password: {$tempPassword}\n\nLogin URL: {$loginUrl}\n\nYou will be asked to change your password after first login.\n\nIf you did not expect this invitation, please ignore this email.";

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;

        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
        $mail->addAddress($toEmail, $toName);
        $mail->isHTML(true);
        $mail->Subject = "Invitation to join Styled Admin";
        $mail->Body    = $htmlBody;
        $mail->AltBody = $textBody;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Staff invitation email failed: " . $mail->ErrorInfo);
        return false;
    }
}