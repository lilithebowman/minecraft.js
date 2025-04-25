import * as THREE from 'three';

export class Frustum {
    constructor() {
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
    }

    update(camera) {
        this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }

    isChunkVisible(chunk) {
        // Create a bounding box for the chunk
        // Chunks are 16x256x16 blocks
        const minX = chunk.x * 16;
        const minZ = chunk.z * 16;
        const box = new THREE.Box3(
            new THREE.Vector3(minX, 0, minZ),
            new THREE.Vector3(minX + 16, 256, minZ + 16)
        );

        return this.frustum.intersectsBox(box);
    }
}
