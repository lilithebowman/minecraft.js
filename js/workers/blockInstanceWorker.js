import * as THREE from 'three';

self.onmessage = function(e) {
    const { chunks, INSTANCES_PER_TYPE } = e.data;
    const instanceData = new Map();
    const matrix = new THREE.Matrix4();

    // Process each chunk
    for (const chunk of chunks) {
        for (const block of chunk.visibleBlocks) {
            if (!instanceData.has(block.type)) {
                instanceData.set(block.type, {
                    positions: [],
                    count: 0
                });
            }
            
            const typeData = instanceData.get(block.type);
            if (typeData.count < INSTANCES_PER_TYPE) {
                matrix.setPosition(block.position.x, block.position.y, block.position.z);
                typeData.positions.push(matrix.elements);
                typeData.count++;
            }
        }
    }

    // Send back the processed data
    self.postMessage({
        instanceData: Array.from(instanceData.entries())
    });
};