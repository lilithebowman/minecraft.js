<?php
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Allow requests only from your domain
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

// Get the raw POST data
$data = file_get_contents('php://input');
$json = json_decode($data);

if (!$json || !isset($json->name) || !isset($json->data)) {
    echo json_encode(['error' => 'Invalid data format']);
    exit;
}

try {
    // Remove data URI header
    $base64Data = str_replace('data:image/png;base64,', '', $json->data);
    $imageData = base64_decode($base64Data);
    
    if ($imageData === false) {
        throw new Exception('Invalid base64 data');
    }

    // Set the textures directory with full path
    $texturesDir = __DIR__ . '/textures';

    // Create directory if it doesn't exist
    if (!file_exists($texturesDir)) {
        if (!mkdir($texturesDir, 0755, true)) {
            throw new Exception('Failed to create textures directory');
        }
    }

    // Check directory permissions
    if (!is_writable($texturesDir)) {
        throw new Exception('Textures directory is not writable');
    }

    // Save the file
    $filename = $texturesDir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $json->name) . '.png';
    if (file_put_contents($filename, $imageData) === false) {
        throw new Exception('Failed to write file');
    }

    echo json_encode([
        'success' => true,
        'file' => basename($filename),
        'path' => $filename
    ]);

} catch (Exception $e) {
    error_log('Texture save error: ' . $e->getMessage());
    echo json_encode([
        'error' => 'Failed to save file',
        'details' => $e->getMessage()
    ]);
}
?>