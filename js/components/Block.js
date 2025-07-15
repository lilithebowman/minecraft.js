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
		this.element = null;
		this.faces = [];
		this.isVisible = true;
		this.isHighlighted = false;
		this.isInDOM = false;

		// Block size in CSS pixels
		this.size = 32;

		// Face names for cube
		this.faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];

		// Lazy creation - only create when needed
		this.needsCreation = true;
	}

	/**
	 * Create the DOM element for this block (lazy)
	 */
	createElement() {
		if (!this.needsCreation) return;

		this.element = document.createElement('div');
		this.element.className = `block block-${this.type}`;

		// Set 3D position
		this.updatePosition();

		// Create the 6 faces of the cube
		this.createFaces();

		// Store reference to this block instance
		this.element._blockInstance = this;

		this.needsCreation = false;
	}

	/**
	 * Create the 6 faces of the cube (optimized)
	 */
	createFaces() {
		this.faces = [];

		// Create faces in a more efficient way
		const fragment = document.createDocumentFragment();

		this.faceNames.forEach(faceName => {
			const face = document.createElement('div');
			face.className = `block-face face-${faceName}`;
			face.dataset.face = faceName;
			fragment.appendChild(face);
			this.faces.push(face);
		});

		this.element.appendChild(fragment);
	}

	/**
	 * Update the 3D position of this block
	 */
	updatePosition() {
		if (!this.element) return;

		const pixelX = this.x * this.size;
		const pixelY = -this.y * this.size; // Negative because CSS Y is inverted
		const pixelZ = this.z * this.size;

		this.element.style.transform = `translate3d(${pixelX}px, ${pixelY}px, ${pixelZ}px)`;
	}

	/**
	 * Change the block type
	 */
	setType(newType) {
		if (this.type === newType) return;

		this.type = newType;
		if (this.element) {
			this.element.className = `block block-${this.type}`;
			if (this.isHighlighted) {
				this.element.classList.add('block-highlighted');
			}
		}
	}

	/**
	 * Set block position
	 */
	setPosition(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.updatePosition();
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
	 */
	optimizeFaces(neighbors) {
		if (!this.element || !this.faces.length) return;

		const faceVisibility = {
			front: !neighbors.front || neighbors.front.isTransparent(),
			back: !neighbors.back || neighbors.back.isTransparent(),
			left: !neighbors.left || neighbors.left.isTransparent(),
			right: !neighbors.right || neighbors.right.isTransparent(),
			top: !neighbors.top || neighbors.top.isTransparent(),
			bottom: !neighbors.bottom || neighbors.bottom.isTransparent()
		};

		this.faces.forEach((face, index) => {
			const faceName = this.faceNames[index];
			face.style.display = faceVisibility[faceName] ? 'block' : 'none';
		});
	}    /**
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
