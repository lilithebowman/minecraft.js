class PhysicsWorker {
    constructor() {
        this.physicsBlocks = ['sand', 'gravel', 'water', 'lava'];
        self.onmessage = (e) => this.handleMessage(e);
    }

    handleMessage(e) {
        const { chunks, dt } = e.data;
        const wrappedChunks = this.wrapChunks(chunks);
        const updates = this.processChunks(wrappedChunks, dt);
        self.postMessage({ updates });
    }

    wrapChunks(chunks) {
        return chunks.map(chunk => ({
            ...chunk,
            getBlock(x, y, z) {
                if (x < 0 || x >= 16 || y < 0 || y >= 256 || z < 0 || z >= 16) {
                    return null;
                }
                return this.blocks[(y * 16 * 16) + (z * 16) + x];
            }
        }));
    }

    processChunks(chunks, dt) {
        const updates = [];
        for (const chunk of chunks) {
            for (let x = 0; x < 16; x++) {
                for (let z = 0; z < 16; z++) {
                    const worldX = chunk.x * 16 + x;
                    const worldZ = chunk.z * 16 + z;
                    
                    for (let y = 0; y < 256; y++) {
                        const block = chunk.getBlock(x, y, z);
                        if (this.shouldApplyPhysics(block)) {
                            const update = this.processBlockPhysics(worldX, y, worldZ, block, dt);
                            if (update) updates.push(update);
                        }
                    }
                }
            }
        }
        return updates;
    }

    shouldApplyPhysics(blockType) {
        return this.physicsBlocks.includes(blockType);
    }

    processBlockPhysics(x, y, z, blockType, dt) {
        // Return update instructions instead of directly modifying blocks
        return {
            type: 'move',
            from: { x, y, z },
            to: { x, y: y - Math.min(20 * dt, 1), z },
            blockType
        };
    }
}

// Initialize the worker
new PhysicsWorker();