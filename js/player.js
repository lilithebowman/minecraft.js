import * as THREE from 'three';
import { Position } from './physics/position.js';
import { Velocity } from './physics/velocity.js';
import { debug } from './debug.js';

export class Player {
	constructor(position = new Position(0, 100, 0)) {
		// Initialize properties
		this.position = position;
		this.velocity = new Velocity();
		this.size = { x: 0.6, y: 1.8, z: 0.6 };
		this.eyeHeight = 1.6;
		this.rotation = 0;
		this.pitch = 0;

		// Initialize direction vectors
		this.forward = new THREE.Vector3(0, 0, -1);
		this.right = new THREE.Vector3(1, 0, 0);

		// Initialize states
		this.isGrounded = false;
		this.isFrozen = false;
		this.isFlying = false;
	}

	getCamera() {
		if (typeof this.camera !== THREE.PerspectiveCamera) {
			this.camera = new THREE.PerspectiveCamera(
				75, // FOV
				window.innerWidth / window.innerHeight,
				0.1, // Near plane
				1000 // Far plane
			);
			this.camera.position.set(
				this.position.x,
				this.position.y + this.eyeHeight,
				this.position.z
			);
			this.camera.rotation.set(
				this.pitch,
				this.rotation,
				0,
				'YXZ' // Rotation order
			);
			this.camera.updateProjectionMatrix();
			this.camera.updateMatrixWorld();
		}
		return this.camera;
	}

	updateCameraPosition() {
		if (!this.camera) return;

		// Set camera position at eye level
		this.camera.position.set(
			this.position.x,
			this.position.y + this.eyeHeight,
			this.position.z
		);

		// Update camera rotation
		this.camera.rotation.set(
			this.pitch,
			this.rotation,
			0,
			'YXZ' // Rotation order
		);

		// Force matrix updates
		this.camera.updateProjectionMatrix();
		this.camera.updateMatrixWorld();
	}

	async initialize() {
		// Create camera
		this.camera = new THREE.PerspectiveCamera(
			75, // FOV
			window.innerWidth / window.innerHeight,
			0.1, // Near plane
			1000 // Far plane
		);

		// Set initial camera position and rotation
		this.updateCameraPosition();

		// Force matrix updates
		this.camera.updateProjectionMatrix();
		this.camera.updateMatrixWorld();

		// Create crosshair
		this.createCrosshair();

		return true;
	}

	getCamera() {
		return this.camera;
	}

	handleResize() {
		if (!this.camera) return;

		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
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
		this.updateCameraPosition();

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
		// Update rotation (yaw)
		this.rotation += angle;

		// Update camera
		if (this.camera) {
			this.camera.rotation.y = this.rotation;
			this.camera.updateMatrixWorld();
		}
	}

	/**
	 * Updates the player's pitch (looking up/down)
	 * @param {number} angle - Pitch angle in radians
	 */
	setPitch(angle) {
		// Clamp pitch to prevent camera flipping
		this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, angle));

		// Update camera
		if (this.camera) {
			this.camera.rotation.x = this.pitch;
			this.camera.updateMatrixWorld();
		}
	}

	/**
	 * Get the THREE.Camera object
	 * @returns {THREE.PerspectiveCamera}
	 */
	getCamera() {
		return this.camera;
	}

	/**
	 * Get the direction the camera is facing
	 * @returns {THREE.Vector3}
	 */
	getCameraDirection() {
		const direction = new THREE.Vector3(0, 0, -1);
		direction.applyQuaternion(this.camera.quaternion);
		return direction;
	}

	/**
	 * Creates a crosshair at the center of the view
	 * @param {THREE.Material} material - Material to use for the crosshair
	 */
	createCrosshair(material) {
		// Create a small cube in the center of view
		const centerCubeGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
		const centerCubeMaterial = material || new THREE.MeshBasicMaterial({ color: 0x000000 });
		this.centerCube = new THREE.Mesh(centerCubeGeometry, centerCubeMaterial);

		// Add it to the camera
		this.camera.add(this.centerCube);

		// Position it slightly in front of the camera
		this.centerCube.position.set(0, 0, -0.5);
	}

	/**
	 * Disposes of all resources
	 */
	dispose() {
		// Remove event listeners
		window.removeEventListener('resize', this.handleResize);

		// Dispose of any meshes
		if (this.centerCube) {
			this.camera.remove(this.centerCube);
			this.centerCube.geometry.dispose();
			this.centerCube.material.dispose();
			this.centerCube = null;
		}
	}
}

export default Player;