import * as THREE from 'three';

export class Collider {
    constructor(position, size) {
        this.position = position;
        this.size = size;
        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();
    }

    updateBoundingBox() {
        this.boundingBox.setFromCenterAndSize(this.position, this.size);
    }

    intersects(other) {
        return this.boundingBox.intersectsBox(other.boundingBox);
    }

    getCenter() {
        const center = new THREE.Vector3();
        this.boundingBox.getCenter(center);
        return center;
    }
}