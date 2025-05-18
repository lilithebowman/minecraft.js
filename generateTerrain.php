<?php

// Create cache/chunks directory if it doesn't exist
if (!is_dir('cache/chunks')) {
    mkdir('cache/chunks', 0755, true);
}

/**
 * Generates a noise value for terrain generation based on the given coordinates and seed.
 *
 * @param float $x The x-coordinate for noise generation.
 * @param float $z The z-coordinate for noise generation.
 * @param int $seed An optional seed value for noise generation (default: 12345).
 * @return float A noise value between 0 and 1.
 */
function generateNoise($x, $z, $seed = 12345) {
    $x = $x * 0.01;
    $z = $z * 0.01;
    return sin($x + $seed) * cos($z + $seed) * 0.5 + 0.5;
}

// Function to generate a single chunk
function generateChunk($chunkX, $chunkZ) {
    // Initialize 3D array (16x256x16)
    $blocks = array();
    
    // Generate a heightmap for this chunk
    $heightMap = array();
    for ($x = 0; $x < 16; $x++) {
        for ($z = 0; $z < 16; $z++) {
            $worldX = $chunkX * 16 + $x;
            $worldZ = $chunkZ * 16 + $z;
            
            // Generate height using noise (value between 0 and 1)
            $noise1 = generateNoise($worldX, $worldZ, 12345);
            $noise2 = generateNoise($worldX * 2, $worldZ * 2, 54321) * 0.5;
            $noise3 = generateNoise($worldX * 4, $worldZ * 4, 98765) * 0.25;
            
            // Combine noise values
            $combined = ($noise1 + $noise2 + $noise3) / 1.75;
            
            // Convert to height (between 40 and 80)
            $height = floor(40 + $combined * 40);
            $heightMap[$x][$z] = $height;
        }
    }
    
    // Generate the blocks based on the heightmap
    for ($x = 0; $x < 16; $x++) {
        for ($z = 0; $z < 16; $z++) {
            $height = $heightMap[$x][$z];
            
            for ($y = 0; $y < 256; $y++) {
                // Determine block type based on height
                if ($y == 0) {
                    $blocks[$x][$y][$z] = "BEDROCK";
                } else if ($y < $height - 4) {
                    $blocks[$x][$y][$z] = "STONE";
                } else if ($y < $height) {
                    $blocks[$x][$y][$z] = "DIRT";
                } else if ($y == $height) {
                    $blocks[$x][$y][$z] = "GRASS";
                } else {
                    // Air above the surface (can be represented as null or empty)
                    $blocks[$x][$y][$z] = null;
                }
            }
        }
    }
    
    return $blocks;
}

// Generate chunks in a grid (5x5 centered around origin by default)
$size = isset($_GET['size']) ? intval($_GET['size']) : 5;
$radius = floor($size / 2);
$count = 0;
$total = $size * $size;

echo "Generating $total chunks...\n";

for ($x = -$radius; $x <= $radius; $x++) {
    for ($z = -$radius; $z <= $radius; $z++) {
        // Generate chunk
        $blocks = generateChunk($x, $z);
        
        // Save to file
        $filename = "cache/chunks/chunk-{$x}-{$z}.json";
        file_put_contents($filename, json_encode($blocks));
        
        $count++;
        echo "Generated chunk $count/$total: $filename\n";
    }
}

echo "Terrain generation complete!\n";
?>