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
		this.height = 64; // Further reduced for better performance

		this.element = null;
		this.blocks = new Map();
		this.isGenerated = false;
		this.isVisible = true;
		this.isDirty = false;

		// Performance optimization limits
		this.lastUpdateTime = 0;
		this.updateThreshold = 32; // ms between updates (increased)
		this.maxBlocksPerFrame = 50; // Limit DOM operations per frame
		this.maxBlocksPerChunk = 1000; // Hard limit on blocks per chunk
		this.pendingBlocks = []; // Queue for batched block creation

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
	 * Generate terrain for this chunk with performance limits
	 */
	async generate(seed = 12345) {
		if (this.isGenerated) return;

		console.log(`Generating chunk at ${this.x}, ${this.z} (optimized)`);

		// Clear existing blocks
		this.blocks.clear();
		this.pendingBlocks = [];

		// Generate terrain with limits
		await this.generateTerrainOptimized(seed);

		this.isGenerated = true;
		this.isDirty = true;
	}

	/**
	 * Generate terrain using optimized approach with limits
	 */
	async generateTerrainOptimized(seed) {
		const baseHeight = 24; // Reduced base height
		const maxVariation = 8; // Reduced variation
		let blocksCreated = 0;

		// Generate in smaller batches to avoid blocking
		for (let localX = 0; localX < this.size && blocksCreated < this.maxBlocksPerChunk; localX++) {
			for (let localZ = 0; localZ < this.size && blocksCreated < this.maxBlocksPerChunk; localZ++) {
				const worldX = this.x * this.size + localX;
				const worldZ = this.z * this.size + localZ;

				// Generate height using simplified noise
				const height = this.generateHeightAtOptimized(worldX, worldZ, seed);

				// Generate column with limits
				const columnBlocks = this.generateColumnAtOptimized(localX, localZ, height);
				blocksCreated += columnBlocks;

				// Yield control periodically to prevent blocking
				if (blocksCreated % 100 === 0) {
					await new Promise(resolve => setTimeout(resolve, 0));
				}
			}
		}

		console.log(`Generated ${blocksCreated} blocks for chunk ${this.x}, ${this.z}`);
	}

	/**
	 * Optimized height generation
	 */
	generateHeightAtOptimized(worldX, worldZ, seed) {
		const baseHeight = 24;
		const maxVariation = 8;

		// Single noise octave for performance
		const noise = this.noise(worldX * 0.02, worldZ * 0.02, seed);
		return Math.floor(baseHeight + noise * maxVariation);
	}

	/**
	 * Generate a column of blocks with limits
	 */
	generateColumnAtOptimized(localX, localZ, height) {
		let blocksCreated = 0;

		// Only generate surface and near-surface blocks
		const minY = Math.max(0, height - 5);
		const maxY = Math.min(height + 1, this.height - 1);

		for (let y = minY; y <= maxY; y++) {
			let blockType = 'stone';

			if (y === height) {
				blockType = 'grass';
			} else if (y >= height - 2) {
				blockType = 'dirt';
			}

			this.pendingBlocks.push({
				localX, y, localZ, blockType
			});
			blocksCreated++;
		}

		// Occasionally add trees (reduced frequency)
		if (Math.random() < 0.005 && blocksCreated < this.maxBlocksPerChunk - 10) {
			blocksCreated += this.generateTreeAtOptimized(localX, localZ, height + 1);
		}

		return blocksCreated;
	}

	/**
	 * Generate a simple tree with limits
	 */
	generateTreeAtOptimized(localX, localZ, baseY) {
		const treeHeight = 3 + Math.floor(Math.random() * 2); // Smaller trees
		let blocksCreated = 0;

		// Tree trunk
		for (let y = 0; y < treeHeight && blocksCreated < 20; y++) {
			this.pendingBlocks.push({
				localX, y: baseY + y, localZ, blockType: 'wood'
			});
			blocksCreated++;
		}

		// Simplified leaves
		const leafTop = baseY + treeHeight;
		for (let x = -1; x <= 1 && blocksCreated < 20; x++) {
			for (let z = -1; z <= 1 && blocksCreated < 20; z++) {
				const leafX = localX + x;
				const leafZ = localZ + z;

				if (this.isValidPosition(leafX, leafTop, leafZ)) {
					this.pendingBlocks.push({
						localX: leafX, y: leafTop, localZ: leafZ, blockType: 'leaves'
					});
					blocksCreated++;
				}
			}
		}

		return blocksCreated;
	}

	/**
	 * Simple noise function
	 */
	noise(x, y, seed) {
		const n = Math.sin(x + seed) * Math.cos(y + seed);
		return (n + 1) / 2; // Normalize to 0-1
	}

	/**
	 * Set a block at local coordinates (optimized)
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
			// Create new block (but don't add to DOM yet)
			const block = new Block(worldX, localY, this.z * this.size + localZ, type);
			this.blocks.set(key, block);
		}

		this.isDirty = true;
	}

	/**
	 * Update chunk rendering with batched DOM operations
	 */
	update() {
		if (!this.isDirty) return;

		const now = performance.now();
		if (now - this.lastUpdateTime < this.updateThreshold) return;

		// Process pending blocks in batches
		this.processPendingBlocks();

		// Update DOM representation
		this.updateDOMBatched();

		this.isDirty = false;
		this.lastUpdateTime = now;
	}

	/**
	 * Process pending blocks in batches
	 */
	processPendingBlocks() {
		const batchSize = Math.min(this.maxBlocksPerFrame, this.pendingBlocks.length);
		const batch = this.pendingBlocks.splice(0, batchSize);

		for (const blockData of batch) {
			this.setBlock(blockData.localX, blockData.y, blockData.localZ, blockData.blockType);
		}

		// If there are still pending blocks, mark as dirty for next frame
		if (this.pendingBlocks.length > 0) {
			this.isDirty = true;
		}
	}

	/**
	 * Update DOM representation with batching
	 */
	updateDOMBatched() {
		if (!this.element) return;

		// Create document fragment for batched DOM operations
		const fragment = document.createDocumentFragment();
		let blocksAdded = 0;

		// Add visible blocks to fragment (limited per frame)
		for (const [key, block] of this.blocks) {
			if (block.type !== 'air' && blocksAdded < this.maxBlocksPerFrame) {
				if (!block.element.parentNode) {
					fragment.appendChild(block.element);
					blocksAdded++;

					// Optimize faces based on neighbors
					const [localX, localY, localZ] = key.split(',').map(Number);
					const neighbors = this.getNeighbors(localX, localY, localZ);
					block.optimizeFaces(neighbors);
				}
			}
		}

		// Add fragment to DOM in one operation
		if (fragment.children.length > 0) {
			this.element.appendChild(fragment);
		}
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
	 * Update chunk rendering with batched DOM operations
	 */
	update() {
		if (!this.isDirty) return;

		const now = performance.now();
		if (now - this.lastUpdateTime < this.updateThreshold) return;

		// Process pending blocks in batches
		this.processPendingBlocks();

		// Update DOM representation
		this.updateDOMBatched();

		this.isDirty = false;
		this.lastUpdateTime = now;
	}

	/**
	 * Process pending blocks in batches
	 */
	processPendingBlocks() {
		const batchSize = Math.min(this.maxBlocksPerFrame, this.pendingBlocks.length);
		const batch = this.pendingBlocks.splice(0, batchSize);

		for (const blockData of batch) {
			this.setBlock(blockData.localX, blockData.y, blockData.localZ, blockData.blockType);
		}

		// If there are still pending blocks, mark as dirty for next frame
		if (this.pendingBlocks.length > 0) {
			this.isDirty = true;
		}
	}

	/**
	 * Update DOM representation with batching
	 */
	updateDOMBatched() {
		if (!this.element) return;

		// Create document fragment for batched DOM operations
		const fragment = document.createDocumentFragment();
		let blocksAdded = 0;

		// Add visible blocks to fragment (limited per frame)
		for (const [key, block] of this.blocks) {
			if (block.type !== 'air' && blocksAdded < this.maxBlocksPerFrame) {
				if (!block.element.parentNode) {
					fragment.appendChild(block.element);
					blocksAdded++;

					// Optimize faces based on neighbors
					const [localX, localY, localZ] = key.split(',').map(Number);
					const neighbors = this.getNeighbors(localX, localY, localZ);
					block.optimizeFaces(neighbors);
				}
			}
		}

		// Add fragment to DOM in one operation
		if (fragment.children.length > 0) {
			this.element.appendChild(fragment);
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
