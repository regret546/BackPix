<?php
require_once '../config/cors.php';
require_once '../config/database.php';

// Simple JWT encode function (no external library needed)
function createJWT($payload, $secret) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payload);
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$authCode = $input['code'] ?? '';
$redirectUri = $input['redirect_uri'] ?? '';

if (empty($authCode) || empty($redirectUri)) {
    http_response_code(400);
    echo json_encode(['error' => 'Authorization code and redirect URI required']);
    exit;
}

try {
    // Exchange authorization code for access token
    $tokenUrl = 'https://oauth2.googleapis.com/token';
    $tokenData = [
        'client_id' => GOOGLE_CLIENT_ID,
        'client_secret' => GOOGLE_CLIENT_SECRET ?? '', // You'll need to add this to database.php
        'code' => $authCode,
        'grant_type' => 'authorization_code',
        'redirect_uri' => $redirectUri
    ];
    
    $tokenOptions = [
        'http' => [
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($tokenData)
        ]
    ];
    
    $tokenContext = stream_context_create($tokenOptions);
    $tokenResponse = file_get_contents($tokenUrl, false, $tokenContext);
    
    if ($tokenResponse === FALSE) {
        throw new Exception('Failed to exchange authorization code for token');
    }
    
    $tokenData = json_decode($tokenResponse, true);
    
    if (!$tokenData || !isset($tokenData['access_token'])) {
        throw new Exception('Invalid token response: ' . ($tokenData['error_description'] ?? 'Unknown error'));
    }
    
    $accessToken = $tokenData['access_token'];
    
    // Get user info from Google
    $userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo?access_token=' . $accessToken;
    $userInfoResponse = file_get_contents($userInfoUrl);
    
    if ($userInfoResponse === FALSE) {
        throw new Exception('Failed to get user info from Google');
    }
    
    $userInfo = json_decode($userInfoResponse, true);
    
    if (!$userInfo || !isset($userInfo['id'])) {
        throw new Exception('Invalid user info response');
    }
    
    $googleId = $userInfo['id'];
    $email = $userInfo['email'];
    $name = $userInfo['name'];
    $avatar = $userInfo['picture'] ?? '';
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT * FROM users WHERE google_id = ? OR email = ?");
    $stmt->execute([$googleId, $email]);
    $user = $stmt->fetch();
    
    if ($user) {
        // Existing user
        $stmt = $pdo->prepare("UPDATE users SET updated_at = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        $isNewUser = false;
    } else {
        // New user - create with 6 credits
        $stmt = $pdo->prepare("
            INSERT INTO users (google_id, email, name, avatar_url, credits) 
            VALUES (?, ?, ?, ?, 6)
        ");
        $stmt->execute([$googleId, $email, $name, $avatar]);
        $userId = $pdo->lastInsertId();
        
        // Log signup bonus
        $stmt = $pdo->prepare("
            INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
            VALUES (?, 6, 'signup_bonus', 'Welcome bonus - 6 free credits')
        ");
        $stmt->execute([$userId]);
        
        // Get new user data
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        $isNewUser = true;
    }
    
    // Create JWT
    $jwtPayload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'iat' => time(),
        'exp' => time() + (7 * 24 * 60 * 60) // 7 days
    ];
    
    $jwt = createJWT($jwtPayload, JWT_SECRET);
    
    echo json_encode([
        'success' => true,
        'token' => $jwt,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'avatar' => $user['avatar_url'],
            'credits' => (int)$user['credits']
        ],
        'is_new_user' => $isNewUser
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
