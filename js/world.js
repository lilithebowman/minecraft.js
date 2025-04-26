import { BlockManager } from './blocks.js';
import { Chunk } from './chunk.js';
import { NoiseGenerator } from './utils/noise.js';
import { Frustum } from './utils/frustum.js';

export class World {
    constructor() {
        this.chunks = new Map();
        this.noiseGen = new NoiseGenerator();
        this.blockManager = new BlockManager();  // Add BlockManager
        this.frustum = new Frustum();
        this.engine = null;
        
        // Initialize physics worker
        this.physicsWorker = new Worker('./js/workers/physicsWorker.js');
        this.physicsWorker.onmessage = (e) => this.handlePhysicsUpdates(e.data);
    }

    async initialize(blockManager) {
        try {
            // Store the block manager reference
            this.blockManager = blockManager;
            
            // Clear any existing chunks
            this.chunks.clear();
            
            // Generate the initial world
            await this.generateWorld();
            
            // Initialize physics if needed
            if (this.physicsWorker) {
                this.physicsWorker.postMessage({
                    type: 'init',
                    chunks: Array.from(this.chunks.values())
                });
            }
            
            return true;
        } catch (error) {
            console.error('World initialization failed:', error);
            throw error;
        }
    }

    generateWorld() {
        console.log('Generating world...'); 
        const scale = 50;
        const amplitude = 32;
        const baseHeight = 64;
        
        // Generate bedrock layer at y = -1024
        for (let x = -16; x < 16; x++) {
            for (let z = -16; z < 16; z++) {
                // Add bedrock block
                const chunk = this.getOrCreateChunk(Math.floor(x/16), Math.floor(z/16));
                chunk.setBlock(x % 16, -1024, z % 16, 'bedrock');
            }
        }
        
        // Generate terrain
        for (let x = -8; x < 8; x++) {
            for (let z = -8; z < 8; z++) {
                let height = baseHeight;
                height += this.noiseGen.noise(x/scale, 0, z/scale) * amplitude;
                height = Math.floor(height);

                for (let y = 0; y < height; y++) {
                    // Add more color variation
                    if (y < 1) {
                        this.setBlock(x, y, z, 'bedrock');
                    } else if (y < height - 4) {
                        this.setBlock(x, y, z, 'stone');
                    } else if (y < height - 1) {
                        this.setBlock(x, y, z, 'dirt');
                    } else {
                        this.setBlock(x, y, z, 'grass');
                    }
                }
            }
        }
        console.log('World generation complete'); // Debug log
    }

    getBlock(x, y, z) {
        const chunk = this.getChunk(Math.floor(x/16), Math.floor(z/16));
        return chunk?.getBlock(x & 15, y, z & 15);
    }

    setBlock(x, y, z, type) {
        const chunk = this.getOrCreateChunk(Math.floor(x/16), Math.floor(z/16));
        const blockId = `${x},${y},${z}`; // Create unique ID for block position
        
        // Remove old block if it exists
        const oldBlock = this.getBlock(x, y, z);
        if (oldBlock) {
            this.blockManager.removeBlock(blockId);
        }

        // Add new block if not null
        if (type) {
            this.blockManager.addBlock(blockId, { type, position: {x, y, z} });
        }

        // Update chunk
        chunk.setBlock(x & 15, y, z & 15, type);
    }

    getVisibleChunks(camera) {
        if (!camera) return Array.from(this.chunks.values());
        
        this.frustum.update(camera);
        return Array.from(this.chunks.values()).filter(chunk => 
            this.frustum.isChunkVisible(chunk)
        );
    }

    hasBlocks() {
        return this.blocks.some(block => block !== null);
    }

    getMeshData() {
        if (!this._meshData) {
            this._meshData = this.generateMeshData();
        }
        return this._meshData;
    }

    /**
     * Finds the highest solid block at a given x, z coordinate.
     * @param {number} x - The x-coordinate.
     * @param {number} z - The z-coordinate.
     * @returns {number} The y-coordinate of the highest solid block, or -1 if no solid block is found.
     */
    getHighestBlockY(x, z) {
        for (let y = 255; y >= 0; y--) {  // Iterate from top to bottom
            const block = this.getBlock(x, y, z);
            if (block !== 0) { // Assuming 0 represents an empty block
                return y;
            }
        }
        return -1; // No solid block found
    }

    generateMeshData() {
        const vertices = [];
        const texCoords = [];
        let vertexCount = 0;

        // For each block in the chunk
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 256; y++) {
                for (let z = 0; z < 16; z++) {
                    const block = this.getBlock(x, y, z);
                    if (block) {
                        // Add vertices for visible faces
                        this.addBlockFaces(x, y, z, block, vertices, texCoords);
                        vertexCount += 24; // 4 vertices per face * 6 faces
                    }
                }
            }
        }

        return {
            vertices: new Float32Array(vertices),
            texCoords: new Float32Array(texCoords),
            vertexCount
        };
    }

    getOrCreateChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        
        if (!this.chunks.has(key)) {
            // Create a new chunk if it doesn't exist
            const chunk = new Chunk(chunkX, chunkZ);
            this.chunks.set(key, chunk);
            return chunk;
        }
        
        return this.chunks.get(key);
    }

    getChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        return this.chunks.get(key);
    }

    update(deltaTime) {
        // Convert deltaTime to seconds for physics calculations
        const dt = deltaTime / 1000;

        // Update chunks that need updating
        for (const chunk of this.chunks.values()) {
            if (chunk.needsUpdate) {
                chunk.rebuildMesh();
                chunk.needsUpdate = false;
            }
        }

        // Update world physics
        this.updatePhysics(dt);
    }

    updatePhysics(dt) {
        // Prepare chunk data for worker - only send serializable data
        const chunks = Array.from(this.chunks.values()).map(chunk => ({
            x: chunk.x,
            z: chunk.z,
            blocks: chunk.blocks
        }));
        
        // Send data to physics worker
        this.physicsWorker.postMessage({ chunks, dt });
    }

    handlePhysicsUpdates(data) {
        const { updates } = data;
        
        for (const update of updates) {
            if (update.type === 'move') {
                const { from, to, blockType } = update;
                this.setBlock(from.x, from.y, from.z, null);
                this.setBlock(to.x, to.y, to.z, blockType);
                
                // Mark affected chunks for update
                const fromChunk = this.getChunk(Math.floor(from.x/16), Math.floor(from.z/16));
                const toChunk = this.getChunk(Math.floor(to.x/16), Math.floor(to.z/16));
                if (fromChunk) fromChunk.needsUpdate = true;
                if (toChunk) toChunk.needsUpdate = true;
            }
        }
    }

    getAllBlocks() {
        const blocks = [];
        for (const chunk of this.chunks.values()) {
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 256; y++) {
                    for (let z = 0; z < 16; z++) {
                        const blockType = chunk.getBlock(x, y, z);
                        if (blockType) {
                            const worldX = chunk.x * 16 + x;
                            const worldZ = chunk.z * 16 + z;
                            blocks.push({
                                type: blockType,
                                position: {x: worldX, y, z: worldZ}
                            });
                        }
                    }
                }
            }
        }
        return blocks;
    }

    getVisibleBlocks(playerPosition, maxBlocks) {
        // Get all blocks first
        const blocks = this.getAllBlocks();
        
        // Sort blocks by distance to player
        blocks.sort((a, b) => {
            const distA = this.getDistanceToPlayer(playerPosition, a.position);
            const distB = this.getDistanceToPlayer(playerPosition, b.position);
            return distA - distB;
        });

        // Return only the closest blocks up to maxBlocks
        return blocks.slice(0, maxBlocks);
    }

    getDistanceToPlayer(playerPos, blockPos) {
        const dx = playerPos.x - blockPos.x;
        const dy = playerPos.y - blockPos.y;
        const dz = playerPos.z - blockPos.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}