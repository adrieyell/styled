<?php
// ============================================
// LOGIN — php/auth/login.php
// ============================================
// POST: email, password
// Returns JSON: { success, user: { user_id, full_name, email, role } }
//             | { success: false, error }

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

// Start session before any output
session_start();

require_once __DIR__ . '/../db.php';

// ── 1. Read input ─────────────────────────────────────────────────────────────
$input    = json_decode(file_get_contents('php://input'), true);
$email    = trim($input['email']    ?? $_POST['email']    ?? '');
$password = $input['password']      ?? $_POST['password'] ?? '';

// ── 2. Basic validation ───────────────────────────────────────────────────────
if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and password are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Please enter a valid email address.']);
    exit;
}

// ── 3. Look up user ───────────────────────────────────────────────────────────
// FIX: column is named `password_hash` in the users table, not `password`
$pdo  = getPDO();
$stmt = $pdo->prepare(
    'SELECT user_id, full_name, email, password_hash, role FROM users WHERE email = ? LIMIT 1'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

// ── 4. Verify password ────────────────────────────────────────────────────────
// Always call password_verify even when user is not found so response time
// does not leak whether the account exists (timing-safe).
$dummy_hash = '$2y$10$usesomesillystringfore7hnbRJHxXVLeakoG8K30oukPsA.ztMG';
$hash       = $user ? $user['password_hash'] : $dummy_hash;   // FIX: password_hash

if (!$user || !password_verify($password, $hash)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Invalid credentials.']);
    exit;
}

// ── 5. Store session ──────────────────────────────────────────────────────────
$_SESSION['user_id']   = (int) $user['user_id'];
$_SESSION['full_name'] = $user['full_name'];
$_SESSION['email']     = $user['email'];
$_SESSION['role']      = $user['role'];

// Regenerate session ID to prevent session fixation attacks
session_regenerate_id(true);

// ── 6. Return success ─────────────────────────────────────────────────────────
echo json_encode([
    'success' => true,
    'user'    => [
        'user_id'   => (int) $user['user_id'],
        'full_name' => $user['full_name'],
        'email'     => $user['email'],
        'role'      => $user['role'],
    ],
]);