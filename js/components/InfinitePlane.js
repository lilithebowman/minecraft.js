/**
 * InfinitePlane Component - Represents an infinite plane at y=0
 * Uses CSS transforms for 3D positioning and rendering
 */
export class InfinitePlane {
	constructor(y = 0, color = '#4a5d23', opacity = 0.8) {
		this.y = y;
		this.color = color;
		this.opacity = opacity;
		this.element = null;
		this.isVisible = true;

		// Plane size - large enough to appear infinite
		this.size = 10000; // CSS pixels

		this.createElement();
	}

	/**
	 * Create the DOM element for the infinite plane
	 */
	createElement() {
		this.element = document.createElement('div');
		this.element.className = 'infinite-plane';

		// Set the plane's position and size
		this.element.style.position = 'absolute';
		this.element.style.width = `${this.size}px`;
		this.element.style.height = `${this.size}px`;
		this.element.style.backgroundColor = this.color;
		this.element.style.opacity = this.opacity;
		this.element.style.transformStyle = 'preserve-3d';

		// Position the plane at the specified y level
		// Center it so it extends in all directions
		this.element.style.transform = `translate3d(${-this.size / 2}px, ${-this.y * 32}px, ${-this.size / 2}px) rotateX(90deg)`;

		// Add some visual texture
		this.element.style.backgroundImage = `
			linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%),
			linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%)
		`;
		this.element.style.backgroundSize = '64px 64px';
		this.element.style.backgroundPosition = '0 0, 32px 32px';

		// Store reference to this plane instance
		this.element._planeInstance = this;
	}

	/**
	 * Update the plane's position
	 */
	updatePosition() {
		if (!this.element) return;

		this.element.style.transform = `translate3d(${-this.size / 2}px, ${-this.y * 32}px, ${-this.size / 2}px) rotateX(90deg)`;
	}

	/**
	 * Set the plane's Y position
	 */
	setY(y) {
		this.y = y;
		this.updatePosition();
	}

	/**
	 * Set the plane's color
	 */
	setColor(color) {
		this.color = color;
		if (this.element) {
			this.element.style.backgroundColor = color;
		}
	}

	/**
	 * Set the plane's opacity
	 */
	setOpacity(opacity) {
		this.opacity = opacity;
		if (this.element) {
			this.element.style.opacity = opacity;
		}
	}

	/**
	 * Set visibility of the plane
	 */
	setVisible(visible) {
		this.isVisible = visible;
		if (this.element) {
			this.element.style.display = visible ? 'block' : 'none';
		}
	}

	/**
	 * Add the plane to a parent DOM element
	 */
	addToDOM(parent) {
		if (this.element && parent && !this.element.parentNode) {
			parent.appendChild(this.element);
		}
	}

	/**
	 * Remove the plane from DOM
	 */
	removeFromDOM() {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
	}

	/**
	 * Get the plane's world position
	 */
	getWorldPosition() {
		return {
			x: 0,
			y: this.y,
			z: 0
		};
	}

	/**
	 * Check if a point is on the plane
	 */
	isOnPlane(worldPos) {
		return Math.abs(worldPos.y - this.y) < 0.1;
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		this.removeFromDOM();
		this.element = null;
	}

	/**
	 * Update method for position tracking
	 */
	update(playerX, playerZ) {
		// Update plane position to follow player (only X and Z)
		if (this.element) {
			const planeX = Math.floor(playerX / this.size) * this.size;
			const planeZ = Math.floor(playerZ / this.size) * this.size;

			this.element.style.transform = `translate3d(${planeX}px, 0px, ${planeZ}px) rotateX(90deg)`;
		}
	}

	/**
	 * Destroy the plane instance
	 */
	destroy() {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
	}
}
