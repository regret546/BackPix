<?php
require_once '../config/cors.php';
require_once '../config/database.php';

// Simple JWT decode function
function verifyJWT($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    
    $header = $parts[0];
    $payload = $parts[1];
    $signature = $parts[2];
    
    $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], 
        base64_encode(hash_hmac('sha256', $header . "." . $payload, $secret, true)));
    
    if ($signature !== $expectedSignature) return false;
    
    $payloadData = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
    
    if ($payloadData['exp'] < time()) return false;
    
    return $payloadData;
}

// Get JWT from Authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'No token provided']);
    exit;
}

$token = $matches[1];
$user = verifyJWT($token, JWT_SECRET);

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get current credits and transaction history
    $stmt = $pdo->prepare("SELECT credits, total_credits_used, created_at FROM users WHERE id = ?");
    $stmt->execute([$user['user_id']]);
    $userData = $stmt->fetch();
    
    // Get recent transactions
    $stmt = $pdo->prepare("
        SELECT amount, transaction_type, description, created_at
        FROM credit_transactions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt->execute([$user['user_id']]);
    $transactions = $stmt->fetchAll();
    
    echo json_encode([
        'credits' => (int)$userData['credits'],
        'total_used' => (int)$userData['total_credits_used'],
        'member_since' => $userData['created_at'],
        'recent_transactions' => $transactions
    ]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Deduct credits
    $input = json_decode(file_get_contents('php://input'), true);
    $creditsToDeduct = (int)($input['amount'] ?? 0);
    $description = $input['description'] ?? 'Image processing';
    
    if ($creditsToDeduct <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid credit amount']);
        exit;
    }
    
    // Check current credits
    $stmt = $pdo->prepare("SELECT credits FROM users WHERE id = ?");
    $stmt->execute([$user['user_id']]);
    $currentCredits = (int)$stmt->fetchColumn();
    
    if ($currentCredits < $creditsToDeduct) {
        http_response_code(400);
        echo json_encode(['error' => 'Insufficient credits']);
        exit;
    }
    
    // Deduct credits in transaction
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            UPDATE users 
            SET credits = credits - ?, total_credits_used = total_credits_used + ?
            WHERE id = ?
        ");
        $stmt->execute([$creditsToDeduct, $creditsToDeduct, $user['user_id']]);
        
        $stmt = $pdo->prepare("
            INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
            VALUES (?, ?, 'image_processing', ?)
        ");
        $stmt->execute([$user['user_id'], -$creditsToDeduct, $description]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'remaining_credits' => $currentCredits - $creditsToDeduct
        ]);
        
    } catch (Exception $e) {
        $pdo->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to deduct credits']);
    }
}
?>
