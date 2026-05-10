<?php
// ============================================
// SESSION CHECK — php/auth/check.php
// ============================================
// GET (no params)
// Returns: { logged_in: true, user: { user_id, full_name, email, role } }
//        | { logged_in: false }

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

if (
    isset($_SESSION['user_id']) &&
    isset($_SESSION['full_name']) &&
    isset($_SESSION['email']) &&
    isset($_SESSION['role'])
) {
    echo json_encode([
        'logged_in' => true,
        'user'      => [
            'user_id'   => (int) $_SESSION['user_id'],
            'full_name' => $_SESSION['full_name'],
            'email'     => $_SESSION['email'],
            'role'      => $_SESSION['role'],
        ],
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}