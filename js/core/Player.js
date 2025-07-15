import { Vector3 } from '../utils/Vector3.js';

export class Player {
	constructor() {
		this.position = new Vector3(0, 65, 0);
		this.velocity = new Vector3(0, 0, 0);
		this.rotation = { x: 0, y: 0 }; // pitch, yaw

		// Movement properties
		this.speed = 5.0;
		this.jumpForce = 8.0;
		this.gravity = -20.0;
		this.friction = 0.8;

		// State
		this.isGrounded = false;
		this.isJumping = false;

		// Input state
		this.inputState = {
			forward: false,
			backward: false,
			left: false,
			right: false,
			jump: false,
			sprint: false,
			sneak: false
		};

		// Camera properties
		this.eyeHeight = 1.6;
		this.mouseSensitivity = 0.002;
	}

	initialize() {
		console.log('Initializing player...');
		// Find a good spawn position
		this.findSpawnPosition();
	}

	findSpawnPosition() {
		// For now, just spawn at a safe height
		this.position.set(0, 65, 0);
	}

	update(deltaTime) {
		this.updateMovement(deltaTime);
		this.updatePhysics(deltaTime);
		this.updateGroundCheck();
	}

	// Movement methods
	move(direction) {
		this.inputState[direction] = true;
	}

	stopMove(direction) {
		this.inputState[direction] = false;
	}

	look(delta) {
		// Apply mouse sensitivity
		this.rotation.x += delta.y * this.mouseSensitivity;
		this.rotation.y += delta.x * this.mouseSensitivity;

		// Clamp pitch to prevent camera flipping
		this.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.rotation.x));
	}

	jump() {
		if (this.isGrounded && !this.isJumping) {
			this.velocity.y = this.jumpForce;
			this.isJumping = true;
			this.isGrounded = false;
		}
	}

	sprint(state) {
		this.inputState.sprint = state;
	}

	sneak(state) {
		this.inputState.sneak = state;
	}

	// Getters for camera system
	getPosition() {
		return this.position;
	}

	getCameraPosition() {
		// Camera is at eye level
		return {
			x: this.position.x,
			y: this.position.y + this.eyeHeight,
			z: this.position.z
		};
	}

	getRotation() {
		return this.rotation;
	}

	updateMovement(deltaTime) {
		const moveVector = new Vector3(0, 0, 0);

		// Calculate movement based on input
		if (this.inputState.forward) {
			moveVector.z -= 1;
		}
		if (this.inputState.backward) {
			moveVector.z += 1;
		}
		if (this.inputState.left) {
			moveVector.x -= 1;
		}
		if (this.inputState.right) {
			moveVector.x += 1;
		}

		// Normalize diagonal movement
		if (moveVector.length() > 0) {
			moveVector.normalize();
		}

		// Apply rotation to movement vector
		const rotatedMove = this.rotateVector(moveVector, this.rotation.y);

		// Apply speed and delta time
		const currentSpeed = this.inputState.sprint ? this.speed * 1.5 : this.speed;
		rotatedMove.multiplyScalar(currentSpeed * deltaTime);

		// Apply to velocity (horizontal only)
		this.velocity.x = rotatedMove.x;
		this.velocity.z = rotatedMove.z;

		// Apply friction when not moving
		if (moveVector.length() === 0) {
			this.velocity.x *= this.friction;
			this.velocity.z *= this.friction;
		}
	}

	updatePhysics(deltaTime) {
		// Apply gravity
		this.velocity.y += this.gravity * deltaTime;

		// Apply velocity to position
		this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

		// Simple ground collision (we'll improve this later)
		if (this.position.y < 32) {
			this.position.y = 32;
			this.velocity.y = 0;
			this.isGrounded = true;
		}
	}

	updateGroundCheck() {
		// Simple ground check - we'll improve this with proper collision later
		this.isGrounded = this.position.y <= 32.1;
	}

	move(direction) {
		switch (direction) {
			case 'forward':
				this.inputState.forward = true;
				break;
			case 'backward':
				this.inputState.backward = true;
				break;
			case 'left':
				this.inputState.left = true;
				break;
			case 'right':
				this.inputState.right = true;
				break;
		}
	}

	stopMove(direction) {
		switch (direction) {
			case 'forward':
				this.inputState.forward = false;
				break;
			case 'backward':
				this.inputState.backward = false;
				break;
			case 'left':
				this.inputState.left = false;
				break;
			case 'right':
				this.inputState.right = false;
				break;
		}
	}

	look(delta) {
		this.rotation.y += delta.x * this.mouseSensitivity;
		this.rotation.x += delta.y * this.mouseSensitivity;

		// Clamp pitch
		this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
	}

	jump() {
		if (this.isGrounded && !this.isJumping) {
			this.velocity.y = this.jumpForce;
			this.isJumping = true;
			this.isGrounded = false;
		}
	}

	sprint(state) {
		this.inputState.sprint = state;
	}

	sneak(state) {
		this.inputState.sneak = state;
	}

	getPosition() {
		return this.position.clone();
	}

	getCameraPosition() {
		return this.position.clone().add(new Vector3(0, this.eyeHeight, 0));
	}

	getRotation() {
		return { ...this.rotation };
	}

	rotateVector(vector, yaw) {
		const cos = Math.cos(yaw);
		const sin = Math.sin(yaw);

		return new Vector3(
			vector.x * cos - vector.z * sin,
			vector.y,
			vector.x * sin + vector.z * cos
		);
	}

	dispose() {
		// Clean up any resources
		this.inputState = null;
	}
}
