<?php
// ============================================
// FORGOT PASSWORD — php/auth/forgot-password.php
// ============================================
// POST: { email }
// Always returns { success: true } for security.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

require_once __DIR__ . '/../db.php';

// ── 1. Read input ─────────────────────────────────────────────────────────────
$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? $_POST['email'] ?? '');

// ── 2. Always return success (don't reveal if email exists) ──────────────────
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => true]);
    exit;
}

$pdo = getPDO();

// ── 3. Look up user ───────────────────────────────────────────────────────────
$stmt = $pdo->prepare('SELECT user_id, full_name FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    // Silently succeed — do not leak account existence
    echo json_encode(['success' => true]);
    exit;
}

// ── 4. Invalidate any existing unused tokens for this user ───────────────────
$pdo->prepare('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0')
    ->execute([$user['user_id']]);

// ── 5. Generate secure token ──────────────────────────────────────────────────
$token = bin2hex(random_bytes(32));

// ── 6. Store in password_resets ───────────────────────────────────────────────
$stmt = $pdo->prepare(
    'INSERT INTO password_resets (user_id, token, expires_at, used)
     VALUES (?, ?, NOW() + INTERVAL 1 HOUR, 0)'
);
$stmt->execute([$user['user_id'], $token]);

// ── 7. Send reset email via PHPMailer ────────────────────────────────────────
$resetLink = 'http://localhost/styled/reset-password.html?token=' . $token;
$name      = htmlspecialchars($user['full_name']);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../../vendor/autoload.php';

// ── CONFIGURE THESE ───────────────────────────────────────────────────────────
define('MAIL_USER', 'orders.styledph@gmail.com');   // your Gmail address
define('MAIL_PASS', 'eqtk hazj ybmm taum');    // Gmail App Password (16 chars)
define('MAIL_FROM', 'orders.styledph@gmail.com');   // same as MAIL_USER for Gmail
define('MAIL_NAME', 'Styled');
// ─────────────────────────────────────────────────────────────────────────────

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = MAIL_USER;
    $mail->Password   = MAIL_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    $mail->setFrom(MAIL_FROM, MAIL_NAME);
    $mail->addAddress($email, $name);
    $mail->Subject = 'Reset your Styled password';

    // Plain text fallback
    $mail->AltBody =
        "Hello {$name},\r\n\r\n"
      . "Reset your password here (valid for 1 hour):\r\n"
      . $resetLink . "\r\n\r\n"
      . "If you didn't request this, ignore this email.\r\n\r\n"
      . "— The Styled Team";

    // HTML body
    $mail->isHTML(true);
    $mail->Body = "
        <div style='font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#1a1a1a;'>
            <p style='font-size:22px;font-weight:400;margin:0 0 8px;'>Reset your password</p>
            <p style='font-size:14px;color:#666;margin:0 0 28px;'>Hi {$name},</p>
            <p style='font-size:14px;color:#444;line-height:1.7;margin:0 0 28px;'>
                We received a request to reset your <strong>Styled</strong> account password.
                Click the button below — this link is valid for <strong>1 hour</strong>.
            </p>
            <a href='{$resetLink}'
               style='display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;
                      padding:14px 32px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;'>
                Reset Password
            </a>
            <p style='font-size:12px;color:#999;margin-top:32px;line-height:1.6;'>
                If you didn't request a password reset, you can safely ignore this email.<br>
                This link will expire in 1 hour.
            </p>
            <hr style='border:none;border-top:1px solid #eee;margin:32px 0;'>
            <p style='font-size:11px;color:#bbb;margin:0;'>— The Styled Team</p>
        </div>
    ";

    $mail->send();
} catch (Exception $e) {
    // Mail failed — token is still saved, log the error silently
    error_log('Styled mailer error: ' . $mail->ErrorInfo);
}

echo json_encode(['success' => true]);