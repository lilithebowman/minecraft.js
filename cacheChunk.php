<?php
// Set headers
header('Content-Type: application/json'); // Ensure the response is JSON
header('Access-Control-Allow-Origin: *'); // Allow cross-origin requests (adjust as needed)
header('Access-Control-Allow-Methods: GET, POST, OPTIONS'); // Specify allowed methods
header('Access-Control-Allow-Headers: Content-Type'); // Allow specific headers

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No content
    exit;
}

// Handle incoming requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $cache = new ChunkCache();
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['x'], $data['z'], $data['blocks'])) {
        if ($cache->saveChunk($data['x'], $data['z'], $data['blocks'])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save chunk']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid chunk data']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $cache = new ChunkCache();

    $x = isset($_GET['x']) ? intval($_GET['x']) : null;
    $z = isset($_GET['z']) ? intval($_GET['z']) : null;
    
    if ($x !== null && $z !== null) {
        $data = $cache->loadChunk($x, $z);
        if ($data !== null) {
            echo json_encode(['success' => true, 'data' => $data]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Chunk not found']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Missing coordinates']);
    }
} else {
    http_response_code(405); // Method not allowed
    echo json_encode(['error' => 'Method not allowed']);
}
