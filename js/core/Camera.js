export class Camera {
	constructor(viewport) {
		this.viewport = viewport;
		this.position = { x: 0, y: 0, z: 0 };
		this.rotation = { x: 0, y: 0 };
		this.fov = 75;

		// Camera settings
		this.perspective = 1000;
		this.scale = 1;

		this.updatePerspective();
	}

	initialize() {
		console.log('Initializing camera...');
		this.handleResize();
	}

	update(player) {
		// Get camera position from player
		const cameraPos = player.getCameraPosition();
		const rotation = player.getRotation();

		this.position.x = cameraPos.x;
		this.position.y = cameraPos.y;
		this.position.z = cameraPos.z;

		this.rotation.x = rotation.x;
		this.rotation.y = rotation.y;
	}

	applyTransform(worldElement) {
		if (!worldElement) return;

		// Calculate the transform matrix
		const transform = this.calculateTransform();

		// Apply transform to world element
		worldElement.style.transform = transform;
	}

	calculateTransform() {
		// Convert world coordinates to screen coordinates
		const screenX = window.innerWidth / 2;
		const screenY = window.innerHeight / 2;

		// Scale factor for blocks
		const blockScale = 20;

		// Build transform string
		let transform = '';

		// Translate to center of screen
		transform += `translate3d(${screenX}px, ${screenY}px, 0) `;

		// Apply camera rotation (invert for world rotation)
		transform += `rotateX(${-this.rotation.x}rad) `;
		transform += `rotateY(${-this.rotation.y}rad) `;

		// Apply camera position (invert for world position)
		transform += `translate3d(${-this.position.x * blockScale}px, ${this.position.y * blockScale}px, ${this.position.z * blockScale}px) `;

		// Apply scale
		transform += `scale3d(${this.scale}, ${this.scale}, ${this.scale})`;

		return transform;
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
