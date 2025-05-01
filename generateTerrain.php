<?php

function perlinNoise($x, $y) {
    // Simple Perlin noise function for terrain generation
    return sin($x * 0.1) * cos($y * 0.1);
}

function generateChunk($chunkX, $chunkZ) {
    $chunk = array();

    // Generate 16x256x16 blocks
    for ($x = 0; $x < 16; $x++) {
        for ($z = 0; $z < 16; $z++) {
            for ($y = 0; $y < 256; $y++) {
                // Generate height based on Perlin noise
                $height = (int)(perlinNoise($chunkX * 16 + $x, $chunkZ * 16 + $z) * 10 + 50);

                // Set block type based on height
                if ($y < $height) {
                    if ($y < $height - 5) {
                        $chunk[$x][$y][$z] = "STONE"; // Stone layer
                    } elseif ($y < $height - 1) {
                        $chunk[$x][$y][$z] = "DIRT"; // Dirt layer
                    } else {
                        $chunk[$x][$y][$z] = "GRASS"; // Grass layer
                    }
                } elseif ($y === $height) {
                    $chunk[$x][$y][$z] = "GRASS"; // Grass surface
                } else {
                    $chunk[$x][$y][$z] = "AIR"; // Air above the surface
                }
                // Bottom layer is bedrock
                if ($y === 0) {
                    $chunk[$x][$y][$z] = "BEDROCK";
                }
            }
        }
    }
    
    return $chunk;
}

// Create cache directory if it doesn't exist
if (!file_exists('cache/chunks')) {
    mkdir('cache/chunks', 0777, true);
}

// Generate chunks in a 5x5 grid as an example
for ($x = -2; $x <= 2; $x++) {
    for ($z = -2; $z <= 2; $z++) {
        $chunk = generateChunk($x, $z);
        $filename = "cache/chunks/chunk-{$x}-{$z}.json";
        file_put_contents($filename, json_encode($chunk, JSON_PRETTY_PRINT));
    }
}

echo "Terrain generation complete.\n";