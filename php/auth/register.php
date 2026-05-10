<?php
// ============================================
// REGISTER — php/auth/register.php
// ============================================
// POST: full_name, email, password
// Returns JSON: { success, user_id, message } | { success: false, error }

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
$pdo = getPDO();

$stmt = $pdo->prepare('SELECT user_id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);

if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'error'   => 'An account with this email already exists.',
    ]);
    exit;
}

// ── 4. Hash password & insert user ───────────────────────────────────────────
$hashed = password_hash($password, PASSWORD_BCRYPT);

// FIX: column is named `password_hash` in the users table, not `password`
$insert = $pdo->prepare(
    'INSERT INTO users (full_name, email, password_hash, role, created_at)
     VALUES (?, ?, ?, \'customer\', NOW())'
);

try {
    $insert->execute([$full_name, $email, $hashed]);
    $user_id = (int) $pdo->lastInsertId();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Registration failed. Please try again.']);
    exit;
}

// ── 5. Return success ─────────────────────────────────────────────────────────
http_response_code(201);
echo json_encode([
    'success' => true,
    'user_id' => $user_id,
    'message' => 'Account created successfully!',
]);