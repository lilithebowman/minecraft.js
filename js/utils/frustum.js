import * as THREE from 'three';

export class Frustum {
    constructor() {
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
    }

    update(camera) {
        const threeCamera = camera;

        this.projScreenMatrix.multiplyMatrices(
            threeCamera.projectionMatrix,
            threeCamera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }

    isChunkVisible(chunk) {
        if (!chunk) return false;

        // Create chunk bounding box
        const minX = chunk.x * 16;
        const minZ = chunk.z * 16;
        const box = new THREE.Box3(
            new THREE.Vector3(minX, 0, minZ),
            new THREE.Vector3(minX + 16, 256, minZ + 16)
        );

        // Check if box intersects frustum
        return this.frustum.intersectsBox(box);
    }

    getChunkDistanceToCamera(chunk, camera) {
        if (!chunk) return Infinity;

        // Calculate the center of the chunk
        const chunkCenter = {
            x: chunk.x * 16 + 8,
            z: chunk.z * 16 + 8
        };

        // Get camera position
        const cameraPosition = camera.position;

        // Calculate distance squared
        const dx = chunkCenter.x - cameraPosition.x;
        const dz = chunkCenter.z - cameraPosition.z;
        return dx * dx + dz * dz;
    }

    // toJSON method to serialize the frustum
    toJSON() {
        return JSON.stringify(this.frustum);
    }
}
