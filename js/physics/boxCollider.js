import { Collider } from './collider.js';
import * as THREE from 'three';

export class BoxCollider extends Collider {
    constructor(position, size = new THREE.Vector3(1, 1, 1)) {
        super(position, size);
        this.type = 'box';
    }

    getOverlap(other) {
        if (!this.intersects(other)) return null;

        const thisCenter = this.getCenter();
        const otherCenter = other.getCenter();
        
        const overlap = new THREE.Vector3();
        
        // Calculate overlap in each axis
        overlap.x = (this.size.x + other.size.x)/2 - Math.abs(thisCenter.x - otherCenter.x);
        overlap.y = (this.size.y + other.size.y)/2 - Math.abs(thisCenter.y - otherCenter.y);
        overlap.z = (this.size.z + other.size.z)/2 - Math.abs(thisCenter.z - otherCenter.z);
        
        return overlap;
    }
}