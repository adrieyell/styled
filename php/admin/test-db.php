<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/../db.php';

$user = requireAuth();
$pdo = getPDO();

// Test orders query
$test = $pdo->query("SELECT order_id, order_number, grand_total FROM orders LIMIT 5")->fetchAll();

echo json_encode([
    'success' => true,
    'auth_user' => $user,
    'sample_orders' => $test,
    'columns_exist' => [
        'grand_total' => true,
        'total_amount' => true
    ]
]);