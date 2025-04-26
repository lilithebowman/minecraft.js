import * as THREE from 'three';

export class Chunk {
    constructor(x, z) {
        this.x = x;
        this.z = z;
        this.size = 16;
        this.height = 256;
        
        // Initialize 3D array for blocks using explicit loops
        this.blocks = [];
        
        // Create x dimension
        for (let x = 0; x < this.size; x++) {
            this.blocks[x] = [];
            // Create y dimension
            for (let y = 0; y < this.height; y++) {
                this.blocks[x][y] = [];
                // Create z dimension
                for (let z = 0; z < this.size; z++) {
                    this.blocks[x][y][z] = null;
                }
            }
        }

        // Verify initialization
        console.log(`Chunk created at (${x}, ${z}), dimensions: ${this.size}x${this.height}x${this.size}`);
        if (!this.blocks[0] || !this.blocks[0][0] || this.blocks[0][0][0] === undefined) {
            console.error('Block array initialization failed');
            throw new Error('Failed to initialize chunk blocks array');
        }

        this.isDirty = false;
    }

    getBlock(x, y, z) {
        // Validate coordinates
        if (x < 0 || x >= this.size || y < 0 || y >= this.height || z < 0 || z >= this.size) {
            return null;
        }
        return this.blocks[x][y][z];
    }

    setBlock(x, y, z, blockType) {
        // Validate coordinates
        if (x < 0 || x >= this.size || y < 0 || y >= this.height || z < 0 || z >= this.size) {
            return false;
        }
        
        this.blocks[x][y][z] = blockType;
        this.isDirty = true;
        return true;
    }
}