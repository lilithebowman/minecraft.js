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
        this.size = { x: 0.6, y: 1.8, z: 0.6 };
        this.rotation = 0;
        this.pitch = 0;
        this.forward = new THREE.Vector3(0, 0, -1);
        this.right = new THREE.Vector3(1, 0, 0);
        this.isGrounded = false;
        
        // Initialize camera
        this.camera = new Camera();
        this.camera.attachToPlayer(this);
        
        // Set initial camera position
        this.camera.updatePosition();
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

        // Update position
        this.position.add(this.velocity.vector.clone().multiplyScalar(deltaTime));

        // Clamp player position
        this.position.x = Math.max(-1024, Math.min(1024, this.position.x));
        this.position.z = Math.max(-1024, Math.min(1024, this.position.z));
        this.position.y = Math.max(-1024, Math.min(1024, this.position.y));

        // Update camera position and rotation
        if (this.camera) {
            this.camera.updatePosition();
        }

        debug.updateStats({
            position: this.position,
            rotation: {
                x: this.pitch,
                y: this.rotation,
                z: 0
            }
        });
    }

    /**
     * Rotates the player horizontally (yaw)
     * @param {number} angle - Rotation angle in radians
     */
    rotate(angle) {
        // Update yaw rotation
        this.rotation += angle;

        // Update forward vector with pitch included
        this.forward.x = Math.sin(this.rotation) * Math.cos(this.pitch);
        this.forward.y = Math.sin(this.pitch);
        this.forward.z = -Math.cos(this.rotation) * Math.cos(this.pitch);
        this.forward.normalize();

        // Update right vector
        const up = new THREE.Vector3(0, 1, 0);
        this.right.crossVectors(this.forward, up);
        this.right.normalize();

        // Update camera
        if (this.camera) {
            this.camera.updateRotation(this.rotation, this.pitch);
        }
    }

    /**
     * Updates the player's pitch (looking up/down)
     * @param {number} angle - Pitch angle in radians
     */
    setPitch(angle) {
        // Clamp pitch to prevent camera flipping
        this.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, angle));
        
        // Update forward vector with new pitch
        this.forward.x = Math.sin(this.rotation) * Math.cos(this.pitch);
        this.forward.y = Math.sin(this.pitch);
        this.forward.z = -Math.cos(this.rotation) * Math.cos(this.pitch);
        this.forward.normalize();

        // Update camera
        if (this.camera) {
            this.camera.updateRotation(this.rotation, this.pitch);
        }
    }
}

export default Player;