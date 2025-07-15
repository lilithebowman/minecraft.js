export class Camera {
	constructor(viewport) {
		this.viewport = viewport;

		// Camera is always at center of viewport
		this.position = { x: 0, y: 0, z: 0 };
		this.rotation = { x: 0, y: 0 };
		this.fov = 75;

		// Camera settings
		this.perspective = 1000;
		this.scale = 1;

		// Block scale for world transformation
		this.blockScale = 32; // CSS pixels per block

		this.updatePerspective();
	}

	initialize() {
		console.log('Initializing camera...');
		this.handleResize();
	}

	update(player) {
		// Get rotation from player (camera follows player's look direction)
		const rotation = player.getRotation();

		this.rotation.x = rotation.x;
		this.rotation.y = rotation.y;
	}

	applyTransform(worldElement) {
		if (!worldElement) return;

		// Get player position (this is what we need to transform the world around)
		const playerPos = this.getPlayerPosition();

		// Calculate the transform matrix to move world around stationary camera
		const transform = this.calculateWorldTransform(playerPos);

		// Apply transform to world element
		worldElement.style.transform = transform;
	}

	calculateWorldTransform(playerPos) {
		// Center of screen (where camera always is)
		const screenX = window.innerWidth / 2;
		const screenY = window.innerHeight / 2;

		// Build transform string - order matters!
		// CSS transforms are applied in reverse order (right to left)
		// So the order here will be: translate3d(-playerPos) → rotateY → rotateX → translate3d(screenCenter)
		let transform = '';

		// 1. Translate to center of screen (applied last)
		transform += `translate3d(${screenX}px, ${screenY}px, 0) `;

		// 2. Apply camera rotation (applied second-to-last)
		// Invert rotations to move world opposite to camera look direction
		transform += `rotateX(${-this.rotation.x}rad) `;
		transform += `rotateY(${-this.rotation.y}rad) `;

		// 3. Translate world opposite to player position (applied first)
		// This moves the world so that the player position becomes the origin
		// Y is NOT inverted - we want the world to move opposite to player Y
		transform += `translate3d(${-playerPos.x * this.blockScale}px, ${-playerPos.y * this.blockScale}px, ${-playerPos.z * this.blockScale}px) `;

		// 4. Apply scale
		transform += `scale3d(${this.scale}, ${this.scale}, ${this.scale})`;

		return transform;
	}

	// Store player position for world transformation
	setPlayerPosition(playerPos) {
		this.playerPosition = playerPos;
	}

	getPlayerPosition() {
		return this.playerPosition || { x: 0, y: 0, z: 0 };
	}

	updatePerspective() {
		if (this.viewport) {
			this.viewport.style.perspective = `${this.perspective}px`;
		}
	}

	handleResize() {
		// Update any size-dependent properties
		this.updatePerspective();
	}

	screenToWorld(screenX, screenY) {
		// Convert screen coordinates to world coordinates
		// This is a simplified version - we'll improve it later
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;

		const deltaX = screenX - centerX;
		const deltaY = screenY - centerY;

		// Apply inverse camera transform
		const worldX = this.position.x + deltaX / 20;
		const worldY = this.position.y - deltaY / 20;
		const worldZ = this.position.z;

		return { x: worldX, y: worldY, z: worldZ };
	}

	worldToScreen(worldX, worldY, worldZ) {
		// Convert world coordinates to screen coordinates
		const blockScale = 20;

		// Apply camera transform
		const relativeX = (worldX - this.position.x) * blockScale;
		const relativeY = (worldY - this.position.y) * blockScale;
		const relativeZ = (worldZ - this.position.z) * blockScale;

		// Project to screen
		const screenX = window.innerWidth / 2 + relativeX;
		const screenY = window.innerHeight / 2 - relativeY;

		return { x: screenX, y: screenY, z: relativeZ };
	}

	dispose() {
		// Clean up
		this.viewport = null;
	}
}
