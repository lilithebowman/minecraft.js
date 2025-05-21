import * as THREE from 'three';
import { Block, BlockTypes } from './modules.js';
import { TextureManager } from './textures.js'; // Import texture mappings
import { debug } from './debug.js'; // Import debug module

export class Chunk {
	constructor(x, z) {
		this.x = x;
		this.z = z;
		this.size = 16;
		this.height = 256;
		this.blocks = [];
		this.mesh = null;
		this.isDirty = false;
		this.needsUpdate = true;
		this.visibleBlocks = [];
		this.needsVisibilityUpdate = true;
		this.textures = new TextureManager();

		// Initialize bedrock layer
		this.initBedrock();
	}

	// Initialize bedrock layer
	initBedrock() {
		// Always default the bottom to BEDROCK
		for (let x = 0; x < this.size; x++) {
			for (let z = 0; z < this.size; z++) {
				const position = { x, y: 0, z };
				if (!this.blocks[position.x]) {
					this.blocks[position.x] = [];
				}
				if (!this.blocks[position.x][position.y]) {
					this.blocks[position.x][position.y] = [];
				}
				if (!this.blocks[position.x][position.y][position.z]) {
					this.blocks[position.x][position.y][position.z] = null;
				}
				// Set the block to bedrock
				this.blocks[position.x][position.y][position.z] = new Block(BlockTypes.BEDROCK);
			}
		}
	}

	async initialize() {
		console.log(`Initializing chunk ${this.x},${this.z}...`);
		try {
			// Initialize base terrain
			for (let x = 0; x < this.size; x++) {
				for (let z = 0; z < this.size; z++) {
					// Start with bedrock layer
					this.setBlock(x, 0, z, 'bedrock');

					// Add stone layer
					for (let y = 1; y < 60; y++) {
						this.setBlock(x, y, z, 'stone');
					}

					// Add dirt layer
					for (let y = 60; y < 63; y++) {
						this.setBlock(x, y, z, 'dirt');
					}

					// Add grass top layer
					this.setBlock(x, 63, z, 'grass');
				}
			}

			console.log(`Chunk ${this.x},${this.z} has ${Object.keys(this.blocks).length} x-coordinates with blocks`);
			this.needsUpdate = true;
			this.isDirty = true;  // Mark as dirty to ensure mesh is built

			return true;
		} catch (error) {
			console.error(`Failed to initialize chunk ${this.x},${this.z}:`, error);
			throw error;
		}
	}

	// Add a block to this chunk
	addBlock(x, y, z, type) {
		this.blocks[x][y][z] = new Block(type, { x, y, z });
		this.isDirty = true;
		return true;
	}

	// Get block count
	getBlockCount() {
		return this.blocks.size;
	}

	// Dispose of the chunk
	dispose() {
		if (this.mesh) {
			// Remove from parent if it has one
			if (this.mesh.parent) {
				this.mesh.parent.remove(this.mesh);
			}

			// Dispose of geometry and material
			if (this.mesh.geometry) {
				this.mesh.geometry.dispose();
			}
			if (this.mesh.material) {
				if (Array.isArray(this.mesh.material)) {
					this.mesh.material.forEach(material => material.dispose());
				} else {
					this.mesh.material.dispose();
				}
			}

			this.mesh = null;
		}

		// Clear all block data
		this.blocks = null;
		this.isDirty = false;
		this.visibleBlocks = [];

		console.log(`Disposed chunk ${this.x},${this.z}`);
	}

	// Get all blocks in this chunk
	getLocalBlocks(camera) {
		const blocks = [];

		// Log to debug
		// console.log(`Getting blocks in chunk ${this.x},${this.z}`);

		// Iterate through ALL blocks in this chunk using LOCAL coordinates
		for (let x = 0; x < this.size; x++) {
			for (let y = 0; y < this.height; y++) {
				for (let z = 0; z < this.size; z++) {
					const blockType = this.getBlock(x, y, z);

					// Only include non-empty blocks
					if (blockType) {
						// Convert to world coordinates for rendering
						const worldX = this.x * this.size + x;
						const worldZ = this.z * this.size + z;

						blocks.push({
							type: blockType,
							position: {
								x: worldX,
								y,
								z: worldZ
							}
						});
					}
				}
			}
		}

		// console.log(`Found ${blocks.length} blocks in chunk ${this.x},${this.z}`);
		return blocks;
	}

	updateVisibleBlocks(camera) {
		this.visibleBlocks = [];

		for (let x = camera.position.x + 0; x < camera.position.x + 16; x++) {
			for (let y = camera.position.y + 0; y < camera.position.y + 256; y++) {
				for (let z = camera.position.z + 0; z < camera.position.z + 16; z++) {
					const blockType = this.getBlock(x, y, z);
					if (blockType && this.isBlockVisible(x, y, z)) {
						this.visibleBlocks.push({
							type: blockType,
							position: {
								x: this.x * 16 + x,
								y: y,
								z: this.z * 16 + z
							}
						});
					}
				}
			}
		}

		this.needsVisibilityUpdate = false;
	}

	isBlockVisible(x, y, z) {
		// Check if block has any exposed faces
		return !this.getBlock(x + 1, y, z) ||
			!this.getBlock(x - 1, y, z) ||
			!this.getBlock(x, y + 1, z) ||
			!this.getBlock(x, y - 1, z) ||
			!this.getBlock(x, y, z + 1) ||
			!this.getBlock(x, y, z - 1);
	}

	getBlocks() {
		const blocks = this.blocks || new Map();
		if (blocks.size === 0) {
			this.initBedrock();
		}
		return this.blocks || new Map();
	}

	getBlock(x, y, z) {
		if (!this.blocks) {
			this.blocks = [];
			this.initBedrock();
			return null;
		}
		if (!this.blocks[x]) return null;
		if (!this.blocks[x][y]) return null;
		return this.blocks[x][y][z];
	}

	setBlock(x, y, z, type) {
		if (!this.blocks[x]) {
			this.blocks[x] = [];
		}
		if (!this.blocks[x][y]) {
			this.blocks[x][y] = [];
		}
		if (!this.blocks[x][y][z]) {
			this.blocks[x][y][z] = null;
		}
		const block = this.blocks[x][y][z];
		if (!block) {
			this.blocks[x][y][z] = new Block(type, { x, y, z });
			return;
		}
		block.blockType = type;
		this.needsVisibilityUpdate = true;
		this.isDirty = true;
		return true;
	}

	removeBlock(x, y, z) {
		if (!this.blocks) {
			this.blocks = [];
			this.initBedrock();
			return false;
		}
		if (!this.blocks[x] || !this.blocks[x][y] || !this.blocks[x][y][z]) {
			return false;
		}

		this.blocks[x][y][z] = null;
		this.isDirty = true;
		return true;
	}

	rebuildMesh() {
		console.log(`Rebuilding mesh for chunk ${this.x},${this.z}`);

		if (!this.blocks) {
			console.warn(`No blocks in chunk ${this.x},${this.z}`);
			return;
		}

		// Create geometry for the chunk
		const geometry = new THREE.BufferGeometry();
		const vertices = [];
		const uvs = [];
		const indices = [];
		let indexOffset = 0;
		let blockCount = 0;

		// For each block in the chunk
		for (let x = 0; x < this.size; x++) {
			for (let y = 0; y < this.height; y++) {
				for (let z = 0; z < this.size; z++) {
					const block = this.getBlock(x, y, z);
					if (!block) continue; // Skip empty blocks

					blockCount++;
					// Check each face
					const faces = this.getVisibleFaces(x, y, z);
					for (const face of faces) {
						// Add face vertices
						const faceVertices = this.getFaceVertices(x, y, z, face);
						vertices.push(...faceVertices);

						// Add face UVs based on block type
						const faceUVs = this.getFaceUVs(block.blockType || block);
						uvs.push(...faceUVs);

						// Add face indices
						indices.push(
							indexOffset, indexOffset + 1, indexOffset + 2,
							indexOffset + 2, indexOffset + 3, indexOffset
						);
						indexOffset += 4;
					}
				}
			}
		}

		console.log(`Found ${blockCount} blocks in chunk ${this.x},${this.z}, creating ${vertices.length / 3} vertices`);

		if (vertices.length === 0) {
			console.warn(`No vertices in chunk ${this.x},${this.z}`);
			this.isDirty = false;
			return;
		}

		// Set geometry attributes
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
		geometry.setIndex(indices);
		geometry.computeVertexNormals();

		// Update or create mesh
		if (this.mesh) {
			this.mesh.geometry.dispose();
			this.mesh.geometry = geometry;
		} else {
			const material = new THREE.MeshLambertMaterial({ color: 0xFF00FF });
			this.mesh = new THREE.Mesh(geometry, material);
			this.mesh.position.set(this.x * this.size, 0, this.z * this.size);
		}

		this.isDirty = false;
		console.log(`Mesh for chunk ${this.x},${this.z} rebuilt successfully`);
	}

	getVisibleFaces(x, y, z) {
		const faces = [];
		const directions = [
			{ dir: [0, 1, 0], name: 'top' },
			{ dir: [0, -1, 0], name: 'bottom' },
			{ dir: [1, 0, 0], name: 'right' },
			{ dir: [-1, 0, 0], name: 'left' },
			{ dir: [0, 0, 1], name: 'front' },
			{ dir: [0, 0, -1], name: 'back' }
		];

		for (const { dir, name } of directions) {
			const [dx, dy, dz] = dir;
			const nx = x + dx;
			const ny = y + dy;
			const nz = z + dz;

			// Check if neighboring block exists
			if (nx < 0 || nx >= this.size ||
				ny < 0 || ny >= this.height ||
				nz < 0 || nz >= this.size) {
				faces.push(name); // Add face if on chunk border
			} else if (!this.getBlock(nx, ny, nz)) {
				faces.push(name); // Add face if neighbor is empty
			}
		}

		return faces;
	}

	getFaceVertices(x, y, z, face) {
		const vertices = [];
		switch (face) {
			case 'top':
				vertices.push(
					x, y + 1, z,     // Top left
					x + 1, y + 1, z, // Top right
					x + 1, y + 1, z + 1, // Bottom right
					x, y + 1, z + 1  // Bottom left
				);
				break;
			case 'bottom':
				vertices.push(
					x, y, z + 1,     // Bottom left
					x + 1, y, z + 1, // Bottom right
					x + 1, y, z,     // Top right
					x, y, z          // Top left
				);
				break;
			case 'left':
				vertices.push(
					x, y, z,         // Top front
					x, y, z + 1,     // Top back
					x, y + 1, z + 1, // Bottom back
					x, y + 1, z      // Bottom front
				);
				break;
			case 'right':
				vertices.push(
					x + 1, y, z + 1,     // Top back
					x + 1, y, z,         // Top front
					x + 1, y + 1, z,     // Bottom front
					x + 1, y + 1, z + 1  // Bottom back
				);
				break;
			case 'front':
				vertices.push(
					x + 1, y, z,     // Top right
					x, y, z,         // Top left
					x, y + 1, z,     // Bottom left
					x + 1, y + 1, z  // Bottom right
				);
				break;
			case 'back':
				vertices.push(
					x, y, z + 1,         // Top left
					x + 1, y, z + 1,     // Top right
					x + 1, y + 1, z + 1, // Bottom right
					x, y + 1, z + 1      // Bottom left
				);
				break;
		}
		return vertices;
	}

	getFaceUVs(blockType) {
		// Return basic UVs for now - these will be updated by the TextureManager
		return [
			0, 0,  // Top left
			1, 0,  // Top right
			1, 1,  // Bottom right
			0, 1   // Bottom left
		];
	}

	async saveToCache() {
		try {
			if (!this.blocks || this.blocks.size === 0) {
				console.error('No blocks to save');
				return false;
			}
			const response = await fetch('cacheChunk.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					x: this.x,
					z: this.z,
					blocks: this.blocks
				})
			});

			const result = await response.json();
			if (!result.success) {
				throw new Error(result.error || 'Failed to cache chunk');
			}

			return true;
		} catch (error) {
			console.error('Failed to cache chunk:', error);
			return false;
		}
	}

	async loadFromCache() {
		try {
			const response = await fetch(`cacheChunk.php?x=${this.x}&z=${this.z}`);
			const result = await response.json();

			if (result.success && result.data) {
				this.blocks = result.data;
				this.isDirty = true;
				return true;
			}

			return false;
		} catch (error) {
			console.error('Failed to load chunk from cache:', error);
			return false;
		}
	}

	static async loadAllFromCache() {
		try {
			const allChunks = [];

			for (let x = -2; x < 2; x++) {
				for (let z = -2; z < 2; z++) {
					try {
						const response = await fetch(`cache/chunks/chunk-${x}-${z}.json`);
						if (response.ok) {
							const chunkData = await response.json();
							allChunks.push({
								x: x,
								z: parseInt(z),
								blocks: chunkData
							});
						}
					} catch (err) {
						console.warn(`Failed to load chunk at ${x},${z}:`, err);
					}
				}
			}

			return allChunks;
		} catch (error) {
			console.error('Error loading chunks from cache:', error);
			return [];
		}
	}

	// Get the top block in the chunk at the given coordinates
	getTopBlockAt(x, z) {
		for (let y = this.height - 1; y >= 0; y--) {
			const block = this.getBlock(x, y, z);
			if (block) {
				return { x, y, z };
			}
		}
		return null;
	}
}
