<?php
// Local Laragon database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'backpix_local');
define('DB_USER', 'root');        // Default Laragon MySQL user
define('DB_PASS', '');            // Default Laragon MySQL password (empty)

// JWT Secret for local development
define('JWT_SECRET', 'local-development-secret-key-change-in-production');

// Google OAuth (replace with your actual client ID and secret)
define('GOOGLE_CLIENT_ID', '1083202700290-5gi4he96crtfrbb7cp6p4u1al7592glh.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', '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'); // You need to get this from Google Cloud Console

// n8n webhook URL (when you set it up)
define('N8N_WEBHOOK_URL', 'http://localhost:5678/webhook/process-images');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
