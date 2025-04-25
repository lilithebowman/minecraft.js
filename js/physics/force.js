import * as THREE from 'three';

export class Force {
    constructor(direction, magnitude, duration = Infinity) {
        this.direction = new THREE.Vector3();
        this.setDirection(direction);
        this.magnitude = magnitude;
        this.duration = duration;
        this.elapsed = 0;
        this.isExpired = false;
    }

    setDirection(direction) {
        this.direction.copy(direction).normalize();
    }

    update(deltaTime) {
        if (this.isExpired) return new THREE.Vector3();

        // Update duration
        if (this.duration !== Infinity) {
            this.elapsed += deltaTime;
            if (this.elapsed >= this.duration) {
                this.isExpired = true;
                return new THREE.Vector3();
            }
        }

        // Calculate force vector
        return this.direction.clone().multiplyScalar(this.magnitude);
    }

    clone() {
        return new Force(this.direction, this.magnitude, this.duration);
    }
}
