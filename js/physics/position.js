import * as THREE from 'three';

export class Position {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Sets the x, y, and z values of the position.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Position}
     */
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this; // For chaining
    }

    /**
     * Copies the values from another Position object.
     * @param {Position} position
     * @returns {Position}
     */
    copy(position) {
        this.x = position.x;
        this.y = position.y;
        this.z = position.z;
        return this; // For chaining
    }

    /**
     * Adds another Position to this one.
     * @param {Position} position
     * @returns {Position}
     */
    add(vector) {
        if (vector instanceof THREE.Vector3) {
            this.x += vector.x;
            this.y += vector.y;
            this.z += vector.z;
        } else {
            this.x += vector.x || 0;
            this.y += vector.y || 0;
            this.z += vector.z || 0;
        }
        return this;
    }

    /**
     * Subtracts another Position from this one.
     * @param {Position} position
     * @returns {Position}
     */
    subtract(position) {
        this.x -= position.x;
        this.y -= position.y;
        this.z -= position.z;
        return this;
    }

    /**
     * Multiplies the position by a scalar value.
     * @param {number} scalar
     * @returns {Position}
     */
    multiplyScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }

    /**
     * Calculates the distance to another Position.
     * @param {Position} position
     * @returns {number}
     */
    distanceTo(position) {
        const dx = this.x - position.x;
        const dy = this.y - position.y;
        const dz = this.z - position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Clones the Position object.
     * @returns {Position}
     */
    clone() {
        return new Position(this.x, this.y, this.z);
    }

    /**
     * Returns a plain JavaScript object representation of the Position.
     * @returns {{x: number, y: number, z: number}}
     */
    toObject() {
        return { x: this.x, y: this.y, z: this.z };
    }
}

export default Position;
