<?php
// Simple test file to verify database connection
require_once 'config/database.php';

echo json_encode([
    'status' => 'success',
    'message' => 'Database connection successful!',
    'database' => DB_NAME,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
