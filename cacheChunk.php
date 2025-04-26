<?php
class ChunkCache {
    private $cacheDir;
    
    public function __construct() {
        $this->cacheDir = __DIR__ . '/cache/chunks/';
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }
    
    public function getCacheFilename($x, $z) {
        return $this->cacheDir . "chunk_{$x}_{$z}.json";
    }
    
    public function saveChunk($x, $z, $data) {
        $filename = $this->getCacheFilename($x, $z);
        $json = json_encode($data);
        
        if (file_put_contents($filename, gzencode($json)) === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save chunk data']);
            return false;
        }

        // Set the file permissions
        chmod($filename, 0644);
        // Set the file ownership
        if (function_exists('posix_getuid')) {
            $uid = posix_getuid();
            chown($filename, $uid);
        }
        // Set the file group ownership
        if (function_exists('posix_getgid')) {
            $gid = posix_getgid();
            chgrp($filename, $gid);
        }
        
        return true;
    }
    
    public function loadChunk($x, $z) {
        $filename = $this->getCacheFilename($x, $z);
        
        if (!file_exists($filename)) {
            return null;
        }
        
        $json = file_get_contents($filename);
        if ($json === false) {
            return null;
        }
        
        // ungzip the data if necessary
        if (substr($json, 0, 2) === "\x1f\x8b") {
            $json = gzinflate(substr($json, 10));
        }
        // Decode the JSON data
        if ($json === false) {
            return null;
        }
        return json_decode($json, true);
    }
}

// Handle incoming requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $cache = new ChunkCache();
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['x'], $data['z'], $data['blocks'])) {
        if ($cache->saveChunk($data['x'], $data['z'], $data['blocks'])) {
            echo json_encode(['success' => true]);
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
}
