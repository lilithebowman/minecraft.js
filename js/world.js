import { Block } from './blocks.js';
import { Chunk } from './chunk.js';
import { NoiseGenerator } from './utils/noise.js';
import { Frustum } from './utils/frustum.js';
import { debug } from './debug.js';
import { isSolidBlockType } from './BlockTypes.js';
import { BlockTypes } from './BlockTypes.js';
import * as THREE from 'three';

export class World {
	constructor() {
		this.chunks = new Map();
		this.noiseGen = new NoiseGenerator();
		this.frustum = new Frustum();
		this.renderDistance = 8; // Chunks
		this.chunkLoadQueue = [];
		this.maxConcurrentLoads = 4;
		this.loadingDiv = null;
		this.totalBlocks = 0;
		this.workers = [];
		this.maxWorkers = navigator.hardwareConcurrency || 4;
		this.visibleBlocks = [];
		this.visibleChunks = new Set();
		this.rotation = new THREE.Vector3(0, 0, 0);
		this.initializeWorkers();
	}

	initializeWorkers() {
		for (let i = 0; i < this.maxWorkers; i++) {
			const worker = new Worker(
				new URL('./workers/worldGenerator.js', import.meta.url),
				{ type: 'module' }
			);
			this.workers.push(worker);
		}
	}

	async generateWorld() {
		console.log('Generating world...');
		const scale = 50;
		const amplitude = 32;
		const baseHeight = 64;

		this.loadingDiv = this.createChunkLoadingDisplay();

		// Check for existing chunks
		const existingChunks = await Chunk.loadAllFromCache();
		if (existingChunks.length > 0) {
			for (const chunkData of existingChunks) {
				const chunk = new Chunk(chunkData.x, chunkData.z);
				chunk.blocks = chunkData.blocks;
				this.chunks.set(`${chunk.x},${chunk.z}`, chunk);
			}
			this.updateChunkLoadingDisplay(existingChunks.length, existingChunks.length);
		}

		if (this.loadingDiv) {
			this.loadingDiv.remove();
		}

		console.log('World generation complete');
	}

	getChunks() {
		return Array.from(this.chunks.values());
	}

	getBlock(x, y, z) {
		const chunk = this.getChunk(Math.floor(x / 16), Math.floor(z / 16));
		return chunk?.getBlock(x & 15, y, z & 15);
	}

	setBlock(x, y, z, type) {
		const chunk = this.getOrCreateChunk(Math.floor(x / 16), Math.floor(z / 16));
		const blockId = `${x},${y},${z}`;

		// Update block manager
		if (type) {
			this.chunk.addBlock(blockId, {
				type,
				position: { x, y, z }
			});
		} else {
			this.chunk.removeBlock(blockId);
		}

		// Update chunk
		chunk.setBlock(x & 15, y, z & 15, type);
		chunk.needsUpdate = true;
	}

	getChunk(chunkX, chunkZ) {
		return this.chunks.get(`${chunkX},${chunkZ}`);
	}

	update(deltaTime) {
		// Update chunks that need updating
		for (const chunk of this.chunks.values()) {
			if (chunk.needsUpdate) {
				chunk.rebuildMesh();
				chunk.needsUpdate = false;
			}
		}
	}

	// Crate a chunk loading display in the middle of the canvas
	createChunkLoadingDisplay() {
		this.loadingDiv = document.createElement('div');
		this.loadingDiv.style.position = 'absolute';
		this.loadingDiv.style.top = '50%';
		this.loadingDiv.style.left = '50%';
		this.loadingDiv.style.transform = 'translate(-50%, -50%)';
		this.loadingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
		this.loadingDiv.style.color = 'white';
		this.loadingDiv.style.padding = '20px';
		this.loadingDiv.style.borderRadius = '10px';
		this.loadingDiv.style.fontSize = '20px';
		this.loadingDiv.innerText = 'Loading chunks...';
		this.loadingDiv.style.zIndex = '1000';
		this.loadingDiv.style.minWidth = '200px';
		this.loadingDiv.style.textAlign = 'center';
		document.body.appendChild(this.loadingDiv);
		return this.loadingDiv;
	}

	// Update the chunk loading display
	updateChunkLoadingDisplay(loadedChunks, totalChunks) {
		this.loadingDiv.innerText = `Loading chunks... ${loadedChunks}/${totalChunks}`;
		if (loadedChunks === totalChunks) {
			this.loadingDiv.innerText = 'Chunks loaded!';
		}
	}

	getVisibleChunks(player) {
		this.chunks.forEach(chunk => {
			const distance = this.getChunkDistanceToCamera(chunk, player);
			if (distance < this.renderDistance * this.renderDistance) {
				this.visibleChunks.add(chunk);
			} else {
				this.visibleChunks.delete(chunk);
			}
		});
		// Update frustum and remove chunks that are not visible
		this.frustum.update(player);
		this.visibleChunks.forEach(chunk => {
			if (!this.frustum.isVisible(chunk)) {
				this.visibleChunks.delete(chunk);
			}
		});
		return Array.from(this.visibleChunks);
	}

	getChunkDistanceToCamera(chunk, camera) {
		const chunkCenter = {
			x: chunk.x * 16 + 8,
			z: chunk.z * 16 + 8
		};
		const dx = chunkCenter.x - camera.position.x;
		const dz = chunkCenter.z - camera.position.z;
		return dx * dx + dz * dz;
	}

	findNearestBlock(position) {
		let nearestBlock = null;
		let minDistance = Infinity;

		// Iterate through all chunks
		for (const [key, chunk] of this.chunks) {
			// For each chunk, iterate through its blocks
			for (let x = 0; x < chunk.size; x++) {
				for (let y = 0; y < chunk.height; y++) {
					for (let z = 0; z < chunk.size; z++) {
						const blockType = chunk.getBlock(x, y, z);

						// Skip empty blocks
						if (!blockType) continue;

						// Calculate world position
						const worldX = chunk.x * 16 + x;
						const worldZ = chunk.z * 16 + z;
						const blockPosition = { x: worldX, y, z: worldZ };

						// Calculate distance to player
						const dx = position.x - blockPosition.x;
						const dy = position.y - blockPosition.y;
						const dz = position.z - blockPosition.z;
						const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

						if (distance < minDistance) {
							minDistance = distance;
							nearestBlock = {
								type: blockType,
								position: blockPosition,
								// Use helper function to determine if block is solid
								isSolid: isSolidBlockType(blockType)
							};
						}
					}
				}
			}
		}

		return nearestBlock;
	}

	// get loaded chunks
	getLoadedChunks() {
		return this.chunks;
	}

	dispose() {
		// Improve cleanup
		this.workers.forEach(worker => worker.terminate());
		this.workers = [];
		this.chunks.forEach(chunk => {
			chunk.dispose(); // Add dispose method to Chunk class
		});
		this.chunks.clear();
		this.block = null;
		this.noiseGen = null;
		if (this.loadingDiv) {
			this.loadingDiv.remove();
			this.loadingDiv = null;
		}
	}

	async initialize(block) {
		try {
			this.block = block;
			await this.generateWorld();
			return true;
		} catch (error) {
			console.error('World initialization failed:', error);
			this.dispose(); // Clean up workers on error
			throw error;
		}
	}

	enableDebug() {
		this.debugMode = true;
		this.debugStats = {
			loadedChunks: 0,
			totalBlocks: 0,
			lastUpdateTime: 0,
			chunkLoadTimes: []
		};
	}

	updateDebugStats() {
		if (!this.debugMode) return;

		this.debugStats.loadedChunks = this.chunks.size;
		this.debugStats.totalBlocks = this.totalBlocks;
		debug.updateStats(this.debugStats);
	}
}
