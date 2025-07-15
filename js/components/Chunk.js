import { Block } from './Block.js';

/**
 * Chunk Component - Represents a 16x16x256 section of the world
 * Manages block generation, rendering, and optimization
 */
export class Chunk {
	constructor(x, z, size = 16) {
		this.x = x;
		this.z = z;
		this.size = size;
		this.height = 128; // Reduced from 256 for better performance

		this.element = null;
		this.blocks = new Map();
		this.isGenerated = false;
		this.isVisible = true;
		this.isDirty = false;

		// Performance optimization
		this.lastUpdateTime = 0;
		this.updateThreshold = 16; // ms between updates

		this.createElement();
	}

	/**
	 * Create the DOM element for this chunk
	 */
	createElement() {
		this.element = document.createElement('div');
		this.element.className = 'chunk';
		this.element.style.position = 'absolute';
		this.element.style.transformStyle = 'preserve-3d';

		// Store reference to this chunk instance
		this.element._chunkInstance = this;
	}

	/**
	 * Generate terrain for this chunk
	 */
	generate(seed = 12345) {
		if (this.isGenerated) return;

		console.log(`Generating chunk at ${this.x}, ${this.z}`);

		// Clear existing blocks
		this.blocks.clear();

		// Generate terrain
		this.generateTerrain(seed);

		this.isGenerated = true;
		this.isDirty = true;
	}

	/**
	 * Generate terrain using improved noise
	 */
	generateTerrain(seed) {
		const baseHeight = 32;
		const maxVariation = 16;

		for (let localX = 0; localX < this.size; localX++) {
			for (let localZ = 0; localZ < this.size; localZ++) {
				const worldX = this.x * this.size + localX;
				const worldZ = this.z * this.size + localZ;

				// Generate height using multiple octaves of noise
				const height = this.generateHeightAt(worldX, worldZ, seed);

				// Place blocks based on height
				this.generateColumnAt(localX, localZ, height);
			}
		}
	}

	/**
	 * Generate height at world coordinates using noise
	 */
	generateHeightAt(worldX, worldZ, seed) {
		const baseHeight = 32;
		const maxVariation = 16;

		// Multiple octaves of noise for more realistic terrain
		const noise1 = this.noise(worldX * 0.01, worldZ * 0.01, seed);
		const noise2 = this.noise(worldX * 0.02, worldZ * 0.02, seed + 1000) * 0.5;
		const noise3 = this.noise(worldX * 0.04, worldZ * 0.04, seed + 2000) * 0.25;

		const combinedNoise = (noise1 + noise2 + noise3) / 1.75;

		return Math.floor(baseHeight + combinedNoise * maxVariation);
	}

	/**
	 * Simple noise function
	 */
	noise(x, y, seed) {
		const n = Math.sin(x + seed) * Math.cos(y + seed);
		return (n + 1) / 2; // Normalize to 0-1
	}

	/**
	 * Generate a column of blocks at local coordinates
	 */
	generateColumnAt(localX, localZ, height) {
		// Bedrock layer
		this.setBlock(localX, 0, localZ, 'stone');

		// Stone layer
		for (let y = 1; y < height - 4; y++) {
			this.setBlock(localX, y, localZ, 'stone');
		}

		// Dirt layer
		for (let y = Math.max(1, height - 4); y < height; y++) {
			this.setBlock(localX, y, localZ, 'dirt');
		}

		// Grass on top
		if (height > 0) {
			this.setBlock(localX, height, localZ, 'grass');
		}

		// Add some variety
		if (Math.random() < 0.01) {
			// Occasional trees
			this.generateTreeAt(localX, localZ, height + 1);
		}
	}

	/**
	 * Generate a simple tree at local coordinates
	 */
	generateTreeAt(localX, localZ, baseY) {
		const treeHeight = 4 + Math.floor(Math.random() * 3);

		// Tree trunk
		for (let y = 0; y < treeHeight; y++) {
			this.setBlock(localX, baseY + y, localZ, 'wood');
		}

		// Tree leaves
		const leafTop = baseY + treeHeight;
		for (let x = -2; x <= 2; x++) {
			for (let z = -2; z <= 2; z++) {
				for (let y = 0; y < 3; y++) {
					if (Math.abs(x) + Math.abs(z) + y < 4) {
						const leafX = localX + x;
						const leafZ = localZ + z;
						const leafY = leafTop + y;

						if (this.isValidPosition(leafX, leafY, leafZ)) {
							this.setBlock(leafX, leafY, leafZ, 'leaves');
						}
					}
				}
			}
		}
	}

	/**
	 * Set a block at local coordinates
	 */
	setBlock(localX, localY, localZ, type) {
		if (!this.isValidPosition(localX, localY, localZ)) return;

		const key = `${localX},${localY},${localZ}`;
		const worldX = this.x * this.size + localX;

		if (this.blocks.has(key)) {
			// Update existing block
			const block = this.blocks.get(key);
			block.setType(type);
		} else {
			// Create new block
			const block = new Block(worldX, localY, this.z * this.size + localZ, type);
			this.blocks.set(key, block);
		}

		this.isDirty = true;
	}

	/**
	 * Get a block at local coordinates
	 */
	getBlock(localX, localY, localZ) {
		if (!this.isValidPosition(localX, localY, localZ)) return null;

		const key = `${localX},${localY},${localZ}`;
		return this.blocks.get(key) || null;
	}

	/**
	 * Remove a block at local coordinates
	 */
	removeBlock(localX, localY, localZ) {
		if (!this.isValidPosition(localX, localY, localZ)) return;

		const key = `${localX},${localY},${localZ}`;
		const block = this.blocks.get(key);

		if (block) {
			block.playBreakAnimation();
			this.blocks.delete(key);
			this.isDirty = true;
		}
	}

	/**
	 * Check if position is valid within chunk bounds
	 */
	isValidPosition(localX, localY, localZ) {
		return localX >= 0 && localX < this.size &&
			localY >= 0 && localY < this.height &&
			localZ >= 0 && localZ < this.size;
	}

	/**
	 * Get the height at local coordinates
	 */
	getHeightAt(localX, localZ) {
		if (!this.isValidPosition(localX, 0, localZ)) return 0;

		// Find the highest non-air block
		for (let y = this.height - 1; y >= 0; y--) {
			const block = this.getBlock(localX, y, localZ);
			if (block && block.type !== 'air') {
				return y;
			}
		}

		return 0;
	}

	/**
	 * Get neighboring blocks for a position
	 */
	getNeighbors(localX, localY, localZ) {
		return {
			front: this.getBlock(localX, localY, localZ - 1),
			back: this.getBlock(localX, localY, localZ + 1),
			left: this.getBlock(localX - 1, localY, localZ),
			right: this.getBlock(localX + 1, localY, localZ),
			top: this.getBlock(localX, localY + 1, localZ),
			bottom: this.getBlock(localX, localY - 1, localZ)
		};
	}

	/**
	 * Update chunk rendering
	 */
	update() {
		if (!this.isDirty) return;

		const now = performance.now();
		if (now - this.lastUpdateTime < this.updateThreshold) return;

		this.updateDOM();
		this.isDirty = false;
		this.lastUpdateTime = now;
	}

	/**
	 * Update DOM representation
	 */
	updateDOM() {
		if (!this.element) return;

		// Clear existing blocks from DOM
		this.element.innerHTML = '';

		// Add visible blocks to DOM
		for (const [key, block] of this.blocks) {
			if (block.type !== 'air') {
				block.addToDOM(this.element);

				// Optimize faces based on neighbors
				const [localX, localY, localZ] = key.split(',').map(Number);
				const neighbors = this.getNeighbors(localX, localY, localZ);
				block.optimizeFaces(neighbors);
			}
		}
	}

	/**
	 * Add chunk to parent DOM element
	 */
	addToDOM(parent) {
		if (this.element && parent && !this.element.parentNode) {
			parent.appendChild(this.element);
		}
	}

	/**
	 * Remove chunk from DOM
	 */
	removeFromDOM() {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
	}

	/**
	 * Set chunk visibility
	 */
	setVisible(visible) {
		this.isVisible = visible;
		if (this.element) {
			this.element.style.display = visible ? 'block' : 'none';
		}
	}

	/**
	 * Get chunk bounds in world coordinates
	 */
	getBounds() {
		return {
			minX: this.x * this.size,
			maxX: (this.x + 1) * this.size,
			minY: 0,
			maxY: this.height,
			minZ: this.z * this.size,
			maxZ: (this.z + 1) * this.size
		};
	}

	/**
	 * Check if world position is within this chunk
	 */
	contains(worldX, worldY, worldZ) {
		const bounds = this.getBounds();
		return worldX >= bounds.minX && worldX < bounds.maxX &&
			worldY >= bounds.minY && worldY < bounds.maxY &&
			worldZ >= bounds.minZ && worldZ < bounds.maxZ;
	}

	/**
	 * Get all blocks in chunk
	 */
	getAllBlocks() {
		return Array.from(this.blocks.values());
	}

	/**
	 * Get blocks by type
	 */
	getBlocksByType(type) {
		return this.getAllBlocks().filter(block => block.type === type);
	}

	/**
	 * Get block count
	 */
	getBlockCount() {
		return this.blocks.size;
	}

	/**
	 * Check if chunk is empty
	 */
	isEmpty() {
		return this.blocks.size === 0;
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		// Dispose all blocks
		for (const block of this.blocks.values()) {
			block.dispose();
		}
		this.blocks.clear();

		// Remove from DOM
		this.removeFromDOM();
		this.element = null;
	}
}
