import * as THREE from 'three';
import { Force } from './physics/force.js';
import { Position } from './physics/position.js';
import { Velocity } from './physics/velocity.js';
import { debug } from './debug.js';
import { Camera } from './camera.js';

export class Player {
    constructor(position = new Position(0, 100, 0)) {
        this.position = position;
        this.velocity = new Velocity();
        this.size = { x: 0.6, y: 1.8, z: 0.6 }; // Player's bounding box size
        this.rotation = 0;
        this.forward = new THREE.Vector3(0, 0, -1);
        this.right = new THREE.Vector3(1, 0, 0);
        this.isGrounded = false;
        this.camera = new Camera();
        this.camera.attachToPlayer(this);
    }

    /**
     * Adds a force to the player
     * @param {Force} force - The force to be added
     */
    addForce(force) {
        if (!force || !(force instanceof Force)) {
            return;
        }

        // Get the force vector for this frame
        const frameForce = force.update(this.deltaTime);
        
        // Apply the force to player's velocity
        if (frameForce) {
            this.velocity.add(frameForce);
            
            // Apply the updated velocity to position
            this.position.add(
                this.velocity.vector.clone().multiplyScalar(this.deltaTime)
            );
        }
    }

    /**
     * Updates the player's state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        this.deltaTime = deltaTime;
        
        // Add gravity if not grounded
        if (!this.isGrounded && !this.isFlying) {
            const gravity = new Force(
                new THREE.Vector3(0, -1, 0),
                9.81 // gravitational acceleration
            );
            this.addForce(gravity/10);
        }

        // Apply drag to slow down movement
        this.velocity.multiply(0.95);

        // Clamp player position to prevent going out of bounds
        this.position.x = Math.max(-1024, Math.min(1024, this.position.x));
        this.position.z = Math.max(-1024, Math.min(1024, this.position.z));
        this.position.y = Math.max(-1024, Math.min(1024, this.position.y));

        debug.updateStats({position: this.position, rotation: this.camera.camera.rotation});
    }

    /**
     * Rotates the player by a given angle in radians
     * Updates forward and right vectors accordingly
     * @param {number} angle - Rotation angle in radians
     */
    rotate(angle) {
        // Update rotation
        this.rotation += angle;

        // Update forward vector
        this.forward.x = Math.sin(this.rotation);
        this.forward.z = -Math.cos(this.rotation);
        this.forward.normalize();

        // Update right vector (cross product of forward and up)
        const up = new THREE.Vector3(0, 1, 0);
        this.right.crossVectors(this.forward, up);
        this.right.normalize();
    }
}

export default Player;