<?php
require_once '../config/cors.php';
require_once '../config/database.php';

// JWT verification function (same as in credits.php)
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

// Authenticate user
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$prompt = $_POST['prompt'] ?? '';
$imageCount = count($_FILES);

if (empty($prompt)) {
    http_response_code(400);
    echo json_encode(['error' => 'Prompt required']);
    exit;
}

if ($imageCount === 0 || $imageCount > 3) {
    http_response_code(400);
    echo json_encode(['error' => 'Please upload 1-3 images']);
    exit;
}

// Check credits before processing
$stmt = $pdo->prepare("SELECT credits FROM users WHERE id = ?");
$stmt->execute([$user['user_id']]);
$currentCredits = (int)$stmt->fetchColumn();

if ($currentCredits < $imageCount) {
    http_response_code(400);
    echo json_encode(['error' => 'Insufficient credits']);
    exit;
}

try {
    // Generate unique job ID
    $jobId = uniqid('job_', true);
    
    // Save uploaded files
    $uploadDir = '../../uploads/' . date('Y/m/d') . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $uploadedFiles = [];
    foreach ($_FILES as $key => $file) {
        if ($file['error'] === UPLOAD_ERR_OK) {
            $filename = $jobId . '_' . basename($file['name']);
            $filepath = $uploadDir . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $filepath)) {
                $uploadedFiles[] = $filepath;
            }
        }
    }
    
    // Create processing job record
    $stmt = $pdo->prepare("
        INSERT INTO processing_jobs (user_id, job_id, image_count, credits_used, status, input_files, processing_options)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
    ");
    $stmt->execute([
        $user['user_id'],
        $jobId,
        $imageCount,
        $imageCount,
        json_encode($uploadedFiles),
        json_encode(['prompt' => $prompt])
    ]);
    
    // Deduct credits
    $stmt = $pdo->prepare("
        UPDATE users 
        SET credits = credits - ?, total_credits_used = total_credits_used + ?
        WHERE id = ?
    ");
    $stmt->execute([$imageCount, $imageCount, $user['user_id']]);
    
    $stmt = $pdo->prepare("
        INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
        VALUES (?, ?, 'image_processing', ?)
    ");
    $stmt->execute([$user['user_id'], -$imageCount, "Processing job: $jobId"]);
    
    // For now, just return success (n8n integration comes later)
    echo json_encode([
        'success' => true,
        'job_id' => $jobId,
        'remaining_credits' => $currentCredits - $imageCount,
        'message' => 'Images uploaded successfully! Processing will be integrated with n8n next.',
        'uploaded_files' => count($uploadedFiles)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to process images: ' . $e->getMessage()]);
}
?>
