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
			jump: new THREE.Vector3(0, 5, 0), // Jump force
			fly: new THREE.Vector3(0, 5, 0), // Fly force
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

		// --- Keyboard Movement Forces ---
		const moveMagnitude = 10.0; // Increased magnitude for testing
		const moveDuration = 0.1;  // Short duration, applied each frame key is held

		// Apply forces using the helper
		if (this.keys.has('KeyW')) {
			this.engine.player.addForce(this.engine.player.forward, moveMagnitude, moveDuration);
		}
		if (this.keys.has('KeyS')) {
			// Calculate backward dynamically instead of relying on player.backward
			const backward = this.engine.player.forward?.clone().negate(); // Use optional chaining and clone
			this.engine.player.addForce(backward, moveMagnitude, moveDuration);
		}
		if (this.keys.has('KeyA')) {
			// Calculate left dynamically instead of relying on player.left
			const left = this.engine.player.right?.clone().negate(); // Use optional chaining and clone
			this.engine.player.addForce(left, moveMagnitude, moveDuration);
		}
		if (this.keys.has('KeyD')) {
			this.engine.player.addForce(this.engine.player.right, moveMagnitude, moveDuration);
		}

		// Handle freeze toggle
		if (event.code === 'KeyF') {
			this.engine.player.isFrozen = !this.engine.player.isFrozen;
			console.log(`Player ${this.engine.player.isFrozen ? 'frozen' : 'unfrozen'}`);
			if (this.engine.player.isFrozen) {
				// Clear all forces when frozen
				this.engine.player.clearForces();
				this.engine.player.velocity.set(0, 0, 0);
			}
		}
	}

	onKeyUp(event) {
		this.keys.delete(event.code);

		// Handle pointer lock on escape key
		if (event.code === 'Escape') {
			document.exitPointerLock();
		}

		// Handle flying toggle
		if (event.code === 'KeyG') {
			this.isFlying = !this.isFlying;
			console.log(`Flying ${this.isFlying ? 'enabled' : 'disabled'}`);
			if (this.isFlying) {
				this.engine.player.velocity.set(0, 0, 0); // Reset velocity when flying is enabled
			}
		}

		// Handle warping to nearest block
		if (event.code === 'Backspace') {
			this.warpToNearestBlock();
		}
	}

	// Create a block at the player's position
	createBlock() {
		const player = this.engine.player;
		const blockPosition = player.position.clone().add(player.forward.clone().multiplyScalar(2));
		const block = this.engine.block.createBlock(blockPosition, 'stone');
		this.engine.world.addBlock(block);
		console.log(`Block created at ${blockPosition.x}, ${blockPosition.y}, ${blockPosition.z}`);
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

		// --- Mouse Handling ---
		if (this.isPointerLocked) {
			if (this.mouseMovement.x !== 0) {
				player.rotate(this.mouseMovement.x * this.mouseSensitivity);
			}
			if (this.mouseMovement.y !== 0) {
				const newPitch = player.pitch - this.mouseMovement.y * this.mouseSensitivity;
				player.setPitch(newPitch); // Assuming setPitch clamps the value
			}
			// On left click, create a block (Consider moving this to a separate click handler)
			if (this.keys.has('Mouse0')) {
				this.createBlock();
			}
		}
		// Reset mouse movement accumulator
		this.mouseMovement.x = 0;
		this.mouseMovement.y = 0;
		this.updateMouseDisplay(); // Update display even if reset


		// --- Key Display ---
		if (this.keyRow) {
			this.keyRow.textContent = this.keys.size > 0
				? `Keys: ${Array.from(this.keys).join(', ')}`
				: 'Keys: none';
		}

		// --- Flying and Jumping ---
		// Handle flying (apply continuous upward force if flying and space is held)
		if (this.isFlying && this.keys.has('Space')) {
			if (this.movementForces.fly) {
				player.addForce(this.movementForces.fly.clone());
			}
		}

		// Handle jump (apply impulse force if grounded and space is pressed, not flying)
		if (this.keys.has('Space') && player.isGrounded && !this.isFlying) {
			if (this.movementForces.jump) {
				player.addForce(this.movementForces.jump.clone());
			}
		}
	}

	// Add this new method to the Input class
	warpToNearestBlock() {
		const player = this.engine.player;
		if (!player) return;

		// Get the nearest block from the world
		const nearestBlock = this.engine.world.findNearestBlock(player.position);

		if (nearestBlock) {
			// Teleport player to the top of the nearest block
			player.position.set(
				nearestBlock.position.x,
				nearestBlock.position.y + 1, // Position player on top of the block
				nearestBlock.position.z
			);

			// Reset player velocity to prevent momentum after warping
			player.velocity.set(0, 0, 0);
			console.log(`Warped to nearest block at ${nearestBlock.position.x}, ${nearestBlock.position.y}, ${nearestBlock.position.z}`);
		} else {
			console.log("No blocks found nearby");
		}
	}
}
