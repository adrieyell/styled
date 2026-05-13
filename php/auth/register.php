<?php
// ============================================
// REGISTER — php/auth/register.php
// ============================================
// POST: full_name, email, password
// Returns JSON: { success, message } | { success: false, error }
// NOTE: Does NOT log user in. Sends verification email instead.

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
require_once __DIR__ . '/../config/smtp.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require_once __DIR__ . '/../../vendor/autoload.php';

// ── 1. Read & sanitise input ─────────────────────────────────────────────────
$input     = json_decode(file_get_contents('php://input'), true);
$full_name = trim($input['full_name'] ?? $_POST['full_name'] ?? '');
$email     = trim($input['email']     ?? $_POST['email']     ?? '');
$password  = $input['password']       ?? $_POST['password']  ?? '';

// ── 2. Server-side validation ────────────────────────────────────────────────
$errors = [];

if (empty($full_name)) {
    $errors[] = 'Full name is required.';
} elseif (mb_strlen($full_name) < 2) {
    $errors[] = 'Full name must be at least 2 characters.';
} elseif (mb_strlen($full_name) > 100) {
    $errors[] = 'Full name must not exceed 100 characters.';
}

if (empty($email)) {
    $errors[] = 'Email address is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
} elseif (mb_strlen($email) > 191) {
    $errors[] = 'Email address is too long.';
}

if (empty($password)) {
    $errors[] = 'Password is required.';
} elseif (mb_strlen($password) < 8) {
    $errors[] = 'Password must be at least 8 characters.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => implode(' ', $errors)]);
    exit;
}

// ── 3. Check for duplicate email ─────────────────────────────────────────────
$pdo  = getPDO();
$stmt = $pdo->prepare('SELECT user_id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);

if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'An account with this email already exists.']);
    exit;
}

// ── 4. Hash password & insert user with is_verified = 0 ──────────────────────
$hashed = password_hash($password, PASSWORD_BCRYPT);
$insert = $pdo->prepare(
    'INSERT INTO users (full_name, email, password_hash, role, is_verified, created_at)
     VALUES (?, ?, ?, \'customer\', 0, NOW())'
);

try {
    $insert->execute([$full_name, $email, $hashed]);
    $user_id = (int) $pdo->lastInsertId();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Registration failed. Please try again.']);
    exit;
}

// ── 5. Generate 6-digit code, store with 15-minute expiry ────────────────────
$code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

// Delete any previous codes for this user first
$pdo->prepare('DELETE FROM email_verifications WHERE user_id = ?')->execute([$user_id]);

// Insert new code
$pdo->prepare(
    'INSERT INTO email_verifications (user_id, code, expires_at)
     VALUES (?, ?, NOW() + INTERVAL 15 MINUTE)'
)->execute([$user_id, $code]);

// ── 6. Send email via PHPMailer ───────────────────────────────────────────────
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
    $mail->addAddress($email, $full_name);

    $mail->isHTML(true);
    $mail->Subject = 'Your Styled verification code';
    $mail->Body    = "
        <div style='font-family:sans-serif;max-width:480px;margin:auto;padding:32px;'>
            <h2 style='color:#2c1f14;margin-bottom:8px;font-family:Georgia,serif;font-weight:400;'>Verify your email</h2>
            <p style='color:#8a7f74;font-size:14px;line-height:1.7;'>Hi {$full_name}, thanks for signing up to Styled. Use this code to verify your email address:</p>
            <div style='font-size:40px;font-weight:400;letter-spacing:14px;text-align:center;
                        padding:28px;background:#f5f0e8;margin:28px 0;color:#2c1f14;font-family:Georgia,serif;'>
                {$code}
            </div>
            <p style='color:#8a7f74;font-size:12px;'>This code expires in <strong style='color:#2c1f14;'>15 minutes</strong>. If you didn't create an account, you can safely ignore this email.</p>
        </div>
    ";
    $mail->AltBody = "Your Styled verification code is: {$code}. It expires in 15 minutes.";

    $mail->send();
} catch (Exception $e) {
    // Log server-side if needed: error_log('Mailer Error: ' . $mail->ErrorInfo);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not send verification email. Please try again.']);
    exit;
}

// ── 7. Return success ─────────────────────────────────────────────────────────
http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Verification code sent to your email.',
]);