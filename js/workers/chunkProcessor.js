import * as THREE from 'three';

class ChunkProcessor {
    constructor() {
        self.onmessage = this.handleMessage.bind(this);
        this.instanceData = new Map();
        this.blockTypes = ['grass', 'dirt', 'stone', 'bedrock'];
        this.setupInstanceData();
    }

    setupInstanceData() {
        this.blockTypes.forEach(type => {
            this.instanceData.set(type, {
                count: 0,
                positions: new Float32Array(16 * 16 * 256 * 16) // Pre-allocate buffer
            });
        });
    }

    handleMessage(e) {
        const { chunks, frustum } = e.data;
        this.processChunks(chunks, frustum);
    }

    processChunks(chunks, frustum) {
        // Reset counts
        this.blockTypes.forEach(type => {
            this.instanceData.get(type).count = 0;
        });

        // Process chunks in parallel using SharedArrayBuffer
        const results = chunks.map(chunk => this.processChunk(chunk, frustum));
        
        // Transfer the data back to main thread
        self.postMessage({ 
            instanceData: this.instanceData
        }, [
            ...this.blockTypes.map(type => 
                this.instanceData.get(type).positions.buffer
            )
        ]);
    }
}

new ChunkProcessor();