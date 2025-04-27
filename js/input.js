import { Force } from './modules.js';
import * as THREE from 'three';

export class Input {
	constructor(engine) {
		this.engine = engine;
		this.keys = new Set();
		this.mouseMovement = { x: 0, y: 0 };
		this.mouseSensitivity = 0.002;
		this.isPointerLocked = false;

		// Add flying and freezing states
		this.isFlying = false;
		this.isFrozen = false;

		// Add movement forces
		this.movementForces = {
			forward: new Force(new THREE.Vector3(0, 0, -1), 1.5),    // Reduced from 5
			backward: new Force(new THREE.Vector3(0, 0, 1), 1.5),    // Reduced from 5
			left: new Force(new THREE.Vector3(-1, 0, 0), 1.5),       // Reduced from 5
			right: new Force(new THREE.Vector3(1, 0, 0), 1.5),       // Reduced from 5
			jump: new Force(new THREE.Vector3(0, 1, 0), 4, 0.15),    // Reduced from 10, shorter duration
			fly: new Force(new THREE.Vector3(0, 1, 0), 1.0)          // Reduced from 5
		};

		// Add camera pitch limits (in radians)
		this.maxPitch = Math.PI / 2 - 0.1; // Just under 90 degrees
		this.minPitch = -Math.PI / 2 + 0.1; // Just over -90 degrees
		
		// Track pitch separately from yaw
		this.pitch = 0;

		// Bind methods to maintain context
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onPointerLockChange = this.onPointerLockChange.bind(this);

		// Initialize input handlers
		this.init();

		// Create key display element
		this.createKeyDisplay();
	}

	createKeyDisplay() {
		this.keyDisplay = document.createElement('div');
		this.keyDisplay.style.position = 'fixed';
		this.keyDisplay.style.bottom = '10px';
		this.keyDisplay.style.left = '10px';
		this.keyDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		this.keyDisplay.style.color = 'white';
		this.keyDisplay.style.padding = '5px';
		this.keyDisplay.style.fontFamily = 'monospace';
		this.keyDisplay.style.fontSize = '12px';
		this.keyDisplay.style.borderRadius = '3px';
		this.keyDisplay.style.pointerEvents = 'none';
		this.keyDisplay.style.width = '200px';
		this.keyDisplay.style.height = '3em';  // Increased height for 2 rows
		this.keyDisplay.style.lineHeight = '1.5em';
		this.keyDisplay.style.display = 'flex';
		this.keyDisplay.style.flexDirection = 'column';
		
		// Create separate elements for keys and mouse
		this.keyRow = document.createElement('div');
		this.mouseRow = document.createElement('div');
		
		this.keyDisplay.appendChild(this.keyRow);
		this.keyDisplay.appendChild(this.mouseRow);
		
		document.body.appendChild(this.keyDisplay);
	}

	init() {
		// Keyboard events
		document.addEventListener('keydown', this.onKeyDown);
		document.addEventListener('keyup', this.onKeyUp);
		
		// Mouse events
		document.addEventListener('mousemove', this.onMouseMove);
		document.addEventListener('click', () => this.requestPointerLock());
		document.addEventListener('pointerlockchange', this.onPointerLockChange);
	}

	onKeyDown(event) {
		this.keys.add(event.code);
		
		// Handle flying toggle
		if (event.code === 'Space') {
			this.isFlying = true;
			console.log('Flying enabled');
		}

		// Handle freeze toggle
		if (event.code === 'KeyF') {
			this.isFrozen = !this.isFrozen;
			console.log(`Player ${this.isFrozen ? 'frozen' : 'unfrozen'}`);
			if (this.isFrozen) {
				// Clear all forces when frozen
				this.engine.player.clearForces();
				this.engine.player.velocity.set(0, 0, 0);
			}
		}
	}

	// Create a block on click
	createBlock() {
		const player = this.engine.player;
		const blockPosition = player.position.clone().add(player.forward.clone().multiplyScalar(2));
		const block = this.engine.block.createBlock(blockPosition, 'stone');
		this.engine.world.addBlock(block);
		console.log(`Block created at ${blockPosition.x}, ${blockPosition.y}, ${blockPosition.z}`);
	}

	onKeyUp(event) {
		this.keys.delete(event.code);
		
		// Stop flying when space is released
		if (event.code === 'Space') {
			this.isFlying = false;
			console.log('Flying disabled');
		}
	}

	onMouseMove(event) {
		if (this.isPointerLocked) {
			// Add mouse movement to accumulator
			this.mouseMovement.x += event.movementX;
			this.mouseMovement.y += event.movementY;
			this.updateMouseDisplay();
		}
	}

	updateMouseDisplay() {
		if (this.mouseRow) {
			const x = Math.round(this.mouseMovement.x * 100) / 100;
			const y = Math.round(this.mouseMovement.y * 100) / 100;
			this.mouseRow.textContent = `Mouse: x=${x} y=${y}`;
		}
	}

	requestPointerLock() {
		document.body.requestPointerLock();
	}

	onPointerLockChange() {
		this.isPointerLocked = document.pointerLockElement !== null;
	}

	destroy() {
		// Remove all event listeners
		document.removeEventListener('keydown', this.onKeyDown);
		document.removeEventListener('keyup', this.onKeyUp);
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('pointerlockchange', this.onPointerLockChange);

		// Remove key display
		if (this.keyDisplay) {
			document.body.removeChild(this.keyDisplay);
			this.keyRow = null;
			this.mouseRow = null;
			this.keyDisplay = null;
		}
	}

	update() {
		const player = this.engine.player;
		if (!player || this.isFrozen) return;

		// Handle mouse movement
		if (this.mouseMovement.x !== 0) {
			player.rotate(this.mouseMovement.x * this.mouseSensitivity);
		}
		
		if (this.mouseMovement.y !== 0) {
			// Update pitch based on vertical mouse movement
			const newPitch = player.pitch - this.mouseMovement.y * this.mouseSensitivity;
			player.setPitch(newPitch);
		}

		// On left click, create a block
		if (this.isPointerLocked && this.keys.has('Mouse0')) {
			this.createBlock();
		}

		// Reset mouse movement
		this.mouseMovement.x = 0;
		this.mouseMovement.y = 0;

		// Update key display
		if (this.keys.size > 0) {
			this.keyRow.textContent = `Keys: ${Array.from(this.keys).join(', ')}`;
		} else {
			this.keyRow.textContent = 'Keys: none';
		}

		// Handle keyboard input and apply forces with higher magnitude
		if (this.keys.has('KeyW')) {
			player.addForce(this.movementForces.forward);
		}
		if (this.keys.has('KeyS')) {
			player.addForce(this.movementForces.backward);
		}
		if (this.keys.has('KeyA')) {
			player.addForce(this.movementForces.left);
		}
		if (this.keys.has('KeyD')) {
			player.addForce(this.movementForces.right);
		}

		// Handle flying
		if (this.isFlying && !player.isGrounded) {
			player.addForce(this.movementForces.fly.clone());
		}

		// Handle jump
		if (this.keys.has('Space') && player.isGrounded) {
			player.addForce(this.movementForces.jump.clone());
		}
	}
}
