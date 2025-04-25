import * as THREE from 'three';

export class Velocity {
    constructor(x = 0, y = 0, z = 0) {
        this.vector = new THREE.Vector3(x, y, z);
    }

    add(vector) {
        this.vector.add(vector);
        return this;
    }

    multiply(scalar) {
        this.vector.multiplyScalar(scalar);
        return this;
    }

    set(x, y, z) {
        this.vector.set(x, y, z);
        return this;
    }

    clone() {
        return new Velocity(
            this.vector.x,
            this.vector.y,
            this.vector.z
        );
    }

    get x() { return this.vector.x; }
    get y() { return this.vector.y; }
    get z() { return this.vector.z; }

    set x(value) { this.vector.x = value; }
    set y(value) { this.vector.y = value; }
    set z(value) { this.vector.z = value; }
}
