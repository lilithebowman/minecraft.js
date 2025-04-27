import * as THREE from 'three';
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
		this.backward = new THREE.Vector3(0, 0, 1);
		this.left = new THREE.Vector3(-1, 0, 0);
		this.isGrounded = false;
		this.isFrozen = true;

		// Initialize camera
		this.camera = new Camera();
		this.camera.attachToPlayer(this);

		// Set initial camera position
		this.camera.updatePosition();
	}

	// Clear all forces
	clearForces() {
		this.velocity.set(0, 0, 0);
	}

	// Add forces to player
	addForce(force) {
		this.velocity.add(force);
	}

	/**
	 * Updates the player's state
	 * @param {number} deltaTime - Time since last update in seconds
	 */
	update(deltaTime) {
		this.deltaTime = deltaTime;

		// Add gravity if not grounded
		if (!this.isGrounded && !this.isFrozen && !this.isFlying) {
			const gravity = new THREE.Vector3(0, -9.81, 0);
			this.velocity.add(gravity.clone().multiplyScalar(deltaTime));
		}

		// Apply drag to slow down movement
		this.velocity.multiply(0.95);

		// Update position
		this.position.add(this.velocity.vector.clone().multiplyScalar(deltaTime));

		// Clamp player position using safe integer limits
		this.position.x = Math.max(Number.MIN_SAFE_INTEGER, Math.min(Number.MAX_SAFE_INTEGER, this.position.x));
		this.position.z = Math.max(Number.MIN_SAFE_INTEGER, Math.min(Number.MAX_SAFE_INTEGER, this.position.z));
		this.position.y = Math.max(Number.MIN_SAFE_INTEGER, Math.min(Number.MAX_SAFE_INTEGER, this.position.y));

		// Update camera position and rotation
		if (this.camera && this.position && this.pitch) {
			this.camera.updatePosition(this.position, this.rotation, this.pitch);
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
		this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, angle));

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