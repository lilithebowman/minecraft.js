import * as THREE from 'three';

export class Frustum {
    constructor() {
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
    }

    update(camera) {
        // Get the actual THREE.Camera object if we're passed our Camera wrapper
        const threeCamera = camera.getCamera ? camera.getCamera() : camera;
        
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

    // toJSON method to serialize the frustum
    toJSON() {
        return JSON.stringify(this.frustum);
    }
}
