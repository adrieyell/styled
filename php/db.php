<?php
// ============================================
// DATABASE CONNECTION — php/db.php
// ============================================
// Returns a shared PDO instance (singleton pattern).
// Usage in any other PHP file:
//   require_once __DIR__ . '/../php/db.php';  (adjust depth as needed)
//   $pdo = getPDO();

define('DB_HOST', 'localhost');
define('DB_NAME', 'styled_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

function getPDO(): PDO {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        DB_HOST,
        DB_NAME,
        DB_CHARSET
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // Never expose the real error message to the client in production.
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error'   => 'Database connection failed. Please try again later.',
        ]);
        exit;
    }

    return $pdo;
}