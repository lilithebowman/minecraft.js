/**
 * Block Component - Represents a single block in the 3D world
 * Uses CSS transforms for 3D positioning and rendering
 */
export class Block {
	constructor(x, y, z, type = 'grass') {
		this.x = x;
		this.y = y;
		this.z = z;
		this.type = type;
	}

	// No DOM element creation needed for WebGL
	createElement() { }

	// No face creation needed for WebGL
	createFaces() { }

	// No position update needed for WebGL
	updatePosition() { }

	setType(newType) {
		this.type = newType;
	}

	setPosition(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	/**
	 * Set visibility of this block
	 */
	setVisible(visible) {
		this.isVisible = visible;
		if (this.element) {
			this.element.style.display = visible ? 'block' : 'none';
		}
	}

	/**
	 * Highlight this block (when player is looking at it)
	 */
	setHighlighted(highlighted) {
		this.isHighlighted = highlighted;
		if (this.element) {
			if (highlighted) {
				this.element.classList.add('block-highlighted');
			} else {
				this.element.classList.remove('block-highlighted');
			}
		}
	}

	/**
	 * Optimize rendering by hiding faces that are covered by neighbors
	 * Note: Face culling disabled - all faces are always visible
	 */
	optimizeFaces(neighbors) {
		if (!this.element || !this.faces.length) return;
		// Always show all faces
		this.faces.forEach(face => {
			face.style.display = 'block';
			// Only air blocks should be fully transparent
			if (this.type === 'air') {
				face.style.opacity = '0';
			} else {
				face.style.opacity = '1';
			}
		});
	}

	/**
	 * Add this block to a parent DOM element (optimized)
	 */
	addToDOM(parent) {
		if (!parent || this.isInDOM) return;

		// Create element if needed
		if (this.needsCreation) {
			this.createElement();
		}

		if (this.element && !this.element.parentNode) {
			parent.appendChild(this.element);
			this.isInDOM = true;
		}
	}

	/**
	 * Remove this block from DOM (optimized)
	 */
	removeFromDOM() {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
			this.isInDOM = false;
		}
	}

	/**
	 * Play block placement animation
	 */
	playPlaceAnimation() {
		if (!this.element) return;

		this.element.classList.add('block-placing');

		// Remove animation class after animation completes
		setTimeout(() => {
			if (this.element) {
				this.element.classList.remove('block-placing');
			}
		}, 300);
	}

	/**
	 * Play block breaking animation
	 */
	playBreakAnimation() {
		if (!this.element) return;

		this.element.classList.add('block-breaking');

		// Remove from DOM after animation
		setTimeout(() => {
			this.removeFromDOM();
		}, 500);
	}

	/**
	 * Get world position of this block
	 */
	getWorldPosition() {
		return { x: this.x, y: this.y, z: this.z };
	}

	/**
	 * Check if this block is solid (blocks movement)
	 */
	isSolid() {
		return !this.isTransparent() && this.type !== 'air';
	}

	/**
	 * Check if this block is transparent
	 */
	isTransparent() {
		const transparentBlocks = ['air', 'water', 'leaves'];
		return transparentBlocks.includes(this.type);
	}

	/**
	 * Check if this block is liquid
	 */
	isLiquid() {
		return this.type === 'water';
	}

	/**
	 * Get block properties
	 */
	getProperties() {
		return {
			type: this.type,
			position: this.getWorldPosition(),
			solid: this.isSolid(),
			transparent: this.isTransparent(),
			liquid: this.isLiquid()
		};
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		this.removeFromDOM();
		this.element = null;
		this.faces = [];
	}

	/**
	 * Static method to get available block types
	 */
	static getBlockTypes() {
		return {
			air: { solid: false, transparent: true, liquid: false },
			grass: { solid: true, transparent: false, liquid: false },
			dirt: { solid: true, transparent: false, liquid: false },
			stone: { solid: true, transparent: false, liquid: false },
			wood: { solid: true, transparent: false, liquid: false },
			leaves: { solid: true, transparent: true, liquid: false },
			water: { solid: false, transparent: true, liquid: true },
			sand: { solid: true, transparent: false, liquid: false }
		};
	}

	/**
	 * Check if a block type is valid
	 */
	static isValidType(type) {
		return type in Block.getBlockTypes();
	}

	/**
	 * Get block type properties
	 */
	static getTypeProperties(type) {
		return Block.getBlockTypes()[type] || null;
	}
}
