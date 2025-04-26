import { BlockManager } from './blocks.js';
import { Chunk } from './chunk.js';
import { NoiseGenerator } from './utils/noise.js';
import { Frustum } from './utils/frustum.js';
import { debug } from './debug.js';

export class World {
    constructor() {
        this.chunks = new Map();
        this.noiseGen = new NoiseGenerator();
        this.blockManager = new BlockManager();
        this.frustum = new Frustum();
        this.renderDistance = 8; // Chunks
        this.chunkLoadQueue = [];
        this.maxConcurrentLoads = 4;
        this.loadingDiv = null;
        this.totalBlocks = 0;
    }

    async initialize(blockManager) {
        try {
            this.blockManager = blockManager;
            await this.generateWorld();
            return true;
        } catch (error) {
            console.error('World initialization failed:', error);
            throw error;
        }
    }

    async generateWorld() {
        console.log('Generating world...');
        const scale = 50;
        const amplitude = 32;
        const baseHeight = 64;

        this.loadingDiv = this.createChunkLoadingDisplay();

        // Generate chunks in render distance
        for (let cx = -this.renderDistance; cx < this.renderDistance; cx++) {
            for (let cz = -this.renderDistance; cz < this.renderDistance; cz++) {
                const chunk = new Chunk(cx, cz);

                // Update the chunk loading display
                this.updateChunkLoadingDisplay(cx, cz);

                // Look for the chunk in the cache
                const loaded = await chunk.loadFromCache();
                if (loaded) {
                    // If loaded, skip generation
                    this.chunks.set(`${cx},${cz}`, chunk);
                    continue;
                }
                
                // If not loaded, generate new chunk
                
                // Generate terrain for this chunk
                for (let x = 0; x < 16; x++) {
                    for (let z = 0; z < 16; z++) {
                        const worldX = (cx * 16) + x;
                        const worldZ = (cz * 16) + z;
                        
                        // Generate height using noise
                        let height = baseHeight;
                        height += this.noiseGen.noise(worldX/scale, 0, worldZ/scale) * amplitude;
                        height = Math.floor(height);

                        // Generate column
                        for (let y = 0; y < height; y++) {
                            let blockType;
                            if (y === 0) {
                                blockType = 'bedrock';
                            } else if (y < height - 4) {
                                blockType = 'stone';
                            } else if (y < height - 1) {
                                blockType = 'dirt';
                            } else {
                                blockType = 'grass';
                            }

                            // Add block to chunk
                            chunk.setBlock(x, y, z, blockType);

                            // Add to total blocks
                            this.totalBlocks++;
                            
                            // Register block with block manager
                            const blockId = `${worldX},${y},${worldZ}`;
                            this.blockManager.addBlock(blockId, {
                                type: blockType,
                                position: { x: worldX, y, z: worldZ }
                            });
                        }
                    }
                }

                // Save the chunk to cache
                await chunk.saveToCache();

                // Initialize chunk mesh
                chunk.rebuildMesh();
                
                // Add chunk to world
                const key = `${cx},${cz}`;
                this.chunks.set(key, chunk);
            }
        }
        
        // Remove loading display
        if (this.loadingDiv) {
            this.loadingDiv.remove();
        }

        // Log completion
        console.log('World generation complete');
    }

    getBlock(x, y, z) {
        const chunk = this.getChunk(Math.floor(x/16), Math.floor(z/16));
        return chunk?.getBlock(x & 15, y, z & 15);
    }

    setBlock(x, y, z, type) {
        const chunk = this.getOrCreateChunk(Math.floor(x/16), Math.floor(z/16));
        const blockId = `${x},${y},${z}`;
        
        // Update block manager
        if (type) {
            this.blockManager.addBlock(blockId, {
                type,
                position: { x, y, z }
            });
        } else {
            this.blockManager.removeBlock(blockId);
        }

        // Update chunk
        chunk.setBlock(x & 15, y, z & 15, type);
        chunk.needsUpdate = true;
    }

    async getOrCreateChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        if (!this.chunks.has(key)) {
            const chunk = new Chunk(chunkX, chunkZ);
            chunk.blockManager = this.blockManager;
            
            // Try to load from cache first
            const loaded = await chunk.loadFromCache();
            if (!loaded) {
                // Generate new chunk if not in cache
                this.generateChunkTerrain(chunk);
                await chunk.saveToCache();
            }
            
            this.chunks.set(key, chunk);
        }
        return this.chunks.get(key);
    }

    generateChunkTerrain(chunk) {
        const scale = 50;
        const amplitude = 32;
        const baseHeight = 64;

        // Generate terrain for this chunk
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const worldX = (chunk.x * 16) + x;
                const worldZ = (chunk.z * 16) + z;
                
                // Generate height using noise
                let height = baseHeight;
                height += this.noiseGen.noise(worldX/scale, 0, worldZ/scale) * amplitude;
                height = Math.floor(height);

                // Generate column
                for (let y = 0; y < height; y++) {
                    let blockType;
                    if (y === 0) {
                        blockType = 'bedrock';
                    } else if (y < height - 4) {
                        blockType = 'stone';
                    } else if (y < height - 1) {
                        blockType = 'dirt';
                    } else {
                        blockType = 'grass';
                    }

                    // Add block to chunk
                    chunk.setBlock(x, y, z, blockType);
                    
                    // Register block with block manager
                    const blockId = `${worldX},${y},${worldZ}`;
                    this.blockManager.addBlock(blockId, {
                        type: blockType,
                        position: { x: worldX, y, z: worldZ }
                    });
                }
            }
        }

        // Mark chunk as dirty to update mesh
        chunk.isDirty = true;
    }

    getChunk(chunkX, chunkZ) {
        return this.chunks.get(`${chunkX},${chunkZ}`);
    }

    update(deltaTime) {
        // Update chunks that need updating
        for (const chunk of this.chunks.values()) {
            if (chunk.needsUpdate) {
                chunk.rebuildMesh();
                chunk.needsUpdate = false;
            }
        }
    }

    // Crate a chunk loading display in the middle of the canvas
    createChunkLoadingDisplay() {
        this.loadingDiv = document.createElement('div');
        this.loadingDiv.style.position = 'absolute';
        this.loadingDiv.style.top = '50%';
        this.loadingDiv.style.left = '50%';
        this.loadingDiv.style.transform = 'translate(-50%, -50%)';
        this.loadingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.loadingDiv.style.color = 'white';
        this.loadingDiv.style.padding = '20px';
        this.loadingDiv.style.borderRadius = '10px';
        this.loadingDiv.style.fontSize = '20px';
        this.loadingDiv.innerText = 'Loading chunks...';
        this.loadingDiv.style.zIndex = '1000';
        this.loadingDiv.style.minWidth = '200px';
        this.loadingDiv.style.textAlign = 'center';
        document.body.appendChild(this.loadingDiv);
        return this.loadingDiv;
    }

    // Update the chunk loading display
    updateChunkLoadingDisplay(loadedChunks, totalChunks) {
        this.loadingDiv.innerText = `Loading chunks... ${loadedChunks},${totalChunks}`;
        if (loadedChunks === totalChunks) {
            this.loadingDiv.innerText = 'Chunks loaded!';
        }
    }

    // Update blocks debug info
    updateBlocksDebugInfo() {
        debug.updateStats({ blocks: this.totalBlocks });
    }

    getVisibleChunks(camera) {
        if (!camera || !camera.position) return [];
        
        this.frustum.update(camera);
        const chunks = Array.from(this.chunks.values())
            .filter(chunk => this.frustum.isChunkVisible(chunk))
            .sort((a, b) => {
                // Sort by distance to camera
                const distA = this.getChunkDistanceToCamera(a, camera);
                const distB = this.getChunkDistanceToCamera(b, camera);
                return distA - distB;
            })
            .slice(0, 32); // Limit max visible chunks
            
        return chunks;
    }

    getChunkDistanceToCamera(chunk, camera) {
        const chunkCenter = {
            x: chunk.x * 16 + 8,
            z: chunk.z * 16 + 8
        };
        const dx = chunkCenter.x - camera.position.x;
        const dz = chunkCenter.z - camera.position.z;
        return dx * dx + dz * dz;
    }

    /**
     * Gets blocks that are visible to the player within render distance
     * @param {Position} playerPosition - Current player position
     * @param {number} maxBlocks - Maximum number of blocks to return
     * @returns {Array} Array of visible blocks sorted by distance to player
     */
    getVisibleBlocks(playerPosition, playerCamera, maxBlocks) {
        const blocks = [];
        const visibleChunks = this.getLocalBlocks(playerCamera);

        // Get blocks from visible chunks
        for (const chunk of visibleChunks) {
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 256; y++) {
                    for (let z = 0; z < 16; z++) {
                        const blockType = chunk.getBlock(x, y, z);
                        if (blockType) {
                            const worldX = chunk.x * 16 + x;
                            const worldZ = chunk.z * 16 + z;
                            
                            // Calculate distance to player
                            const dx = worldX - playerPosition.x;
                            const dy = y - playerPosition.y;
                            const dz = worldZ - playerPosition.z;
                            const distanceSquared = dx * dx + dy * dy + dz * dz;

                            blocks.push({
                                type: blockType,
                                position: { x: worldX, y, z: worldZ },
                                distanceSquared
                            });
                        }
                    }
                }
            }
        }

        // Sort blocks by distance to player
        blocks.sort((a, b) => a.distanceSquared - b.distanceSquared);

        // Return only the closest blocks up to maxBlocks
        return blocks.slice(0, maxBlocks);
    }
}
