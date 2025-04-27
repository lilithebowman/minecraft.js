import { Block } from './blocks.js';
import { Chunk } from './chunk.js';
import { NoiseGenerator } from './utils/noise.js';
import { Frustum } from './utils/frustum.js';
import { debug } from './debug.js';
import { isSolidBlockType } from './BlockTypes.js';
import { BlockTypes } from './BlockTypes.js';

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

		// Create an array of chunk generation tasks
		const tasks = [];
		for (let cx = -this.renderDistance; cx < this.renderDistance; cx++) {
			for (let cz = -this.renderDistance; cz < this.renderDistance; cz++) {
				tasks.push({ cx, cz });
			}
		}

		// Process chunks in parallel using workers
		const chunkPromises = tasks.map(async (task, index) => {
			const worker = this.workers[index % this.maxWorkers];

			// Try loading from cache first
			const chunk = new Chunk(task.cx, task.cz);
			const loaded = await chunk.loadFromCache();

			if (loaded) {
				this.chunks.set(`${task.cx},${task.cz}`, chunk);
				this.updateChunkLoadingDisplay(index, tasks.length);
				return;
			}

			// If not in cache, generate a new chunk
			await this.generateChunkTerrain(chunk);
			this.chunks.set(`${task.cx},${task.cz}`, chunk);
			await chunk.saveToCache();
			this.updateChunkLoadingDisplay(index + 1, tasks.length);
			this.totalBlocks += chunk.getBlockCount();
		});

		// Wait for all chunks to be generated
		await Promise.all(chunkPromises);
		console.log(`Total chunks generated: ${this.chunks.size}`);

		if (this.loadingDiv) {
			this.loadingDiv.remove();
		}

		console.log('World generation complete');
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
			this.block.addBlock(blockId, {
				type,
				position: { x, y, z }
			});
		} else {
			this.block.removeBlock(blockId);
		}

		// Update chunk
		chunk.setBlock(x & 15, y, z & 15, type);
		chunk.needsUpdate = true;
	}

	async getOrCreateChunk(chunkX, chunkZ) {
		const key = `${chunkX},${chunkZ}`;
		if (!this.chunks.has(key)) {
			const chunk = new Chunk(chunkX, chunkZ);
			chunk.block = this.block;

			// Try to load from cache first
			const loaded = await chunk.loadFromCache();
			if (!loaded) {
				// Generate new chunk if not in cache
				this.generateChunkTerrain(chunk);
				await chunk.saveToCache();
			}

			this.chunks.set(key, chunk);
		}
		return this.chunks.get(key);
	}

	async generateChunkTerrain(chunk) {
		const noiseGen = new NoiseGenerator();
		try {
			const scale = 50;
			const amplitude = 32;
			const baseHeight = 64;

			// Generate terrain for this chunk
			for (let x = 0; x < 16; x++) {
				for (let z = 0; z < 16; z++) {
					const worldX = (chunk.x * 16) + x;
					const worldZ = (chunk.z * 16) + z;

					// Generate height using noise
					let height = baseHeight;
					height += noiseGen.noise(worldX / scale, 0, worldZ / scale) * amplitude;
					height = Math.floor(height);

					// Generate column
					for (let y = 0; y < height; y++) {
						let blockType;
						if (y === 0) {
							blockType = BlockTypes.BEDROCK;
						} else if (y < height - 4) {
							blockType = BlockTypes.STONE;
						} else if (y < height - 1) {
							blockType = BlockTypes.DIRT;
						} else {
							blockType = BlockTypes.GRASS;
						}

						// Add block to chunk
						chunk.setBlock(x, y, z, blockType);

						// Register block with block manager
						const blockId = `${worldX},${y},${worldZ}`;
						chunk.addBlock(blockId, {
							type: blockType,
							position: { x: worldX, y, z: worldZ }
						});
					}
				}
			}

			// Mark chunk as dirty to update mesh
			chunk.isDirty = true;
		} catch (error) {
			console.error(`Failed to generate chunk at ${chunk.x},${chunk.z}:`, error);
			// Add fallback terrain generation
			this.generateFallbackTerrain(chunk);
		}
	}

	generateFallbackTerrain(chunk) {
		// Simple flat terrain as fallback
		for (let x = 0; x < 16; x++) {
			for (let z = 0; z < 16; z++) {
				chunk.setBlock(x, 0, z, 'bedrock');
				chunk.setBlock(x, 1, z, 'dirt');
			}
		}
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

		this.updateBlocksDebugInfo(this.visibleBlocks);
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

	// Update blocks debug info
	updateBlocksDebugInfo(size) {
		debug.updateStats({ blocks: size });
	}

	getVisibleChunks(player) {
		if (!player || !player.camera) {
			console.warn('Invalid player object in getVisibleChunks');
			return [];
		}

		// Get the camera position directly from the THREE.PerspectiveCamera
		const cameraPos = player.camera.position;
		const playerX = Math.floor(cameraPos.x / 16);
		const playerZ = Math.floor(cameraPos.z / 16);

		// Get chunks in render distance
		const visibleChunks = [];
		const renderDistance = 8; // Configurable render distance

		for (let x = -renderDistance; x <= renderDistance; x++) {
			for (let z = -renderDistance; z <= renderDistance; z++) {
				const chunkX = playerX + x;
				const chunkZ = playerZ + z;
				const chunk = this.getChunk(chunkX, chunkZ);

				if (chunk) {
					visibleChunks.push(chunk);
				}
			}
		}

		return visibleChunks;
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

	/**
	 * Gets blocks that are visible to the player within render distance
	 * @param {Position} playerPosition - Current player position
	 * @param {number} maxBlocks - Maximum number of blocks to return
	 * @returns {Array} Array of visible blocks sorted by distance to player
	 */
	getVisibleBlocks(playerPosition, playerCamera, maxBlocks) {
		const blocks = [];
		const visibleChunks = this.getLocalBlocks(playerCamera);

		this.visibleBlocks = visibleChunks

		// Get blocks from visible chunks
		for (const chunk of visibleChunks) {
			for (let x = 0; x < 16; x++) {
				for (let y = 0; y < 256; y++) {
					for (let z = 0; z < 16; z++) {
						const blockType = chunk.getBlock(x, y, z);
						if (blockType) {
							const worldX = chunk.x * 16 + x;
							const worldZ = chunk.z * 16 + z;

							// Calculate distance to player
							const dx = worldX - playerPosition.x;
							const dy = y - playerPosition.y;
							const dz = worldZ - playerPosition.z;
							const distanceSquared = dx * dx + dy * dy + dz * dz;

							blocks.push({
								type: blockType,
								position: { x: worldX, y, z: worldZ },
								distanceSquared
							});
						}
					}
				}
			}
		}

		// Sort blocks by distance to player
		blocks.sort((a, b) => a.distanceSquared - b.distanceSquared);

		// Return only the closest blocks up to maxBlocks
		return blocks.slice(0, maxBlocks);
	}

	getLocalBlocks(camera) {
		// Get visible chunks
		const visibleChunks = this.getVisibleChunks(camera);
		const allBlocks = [];

		// Collect blocks from each chunk
		for (const chunk of visibleChunks) {
			const chunkBlocks = chunk.getLocalBlocks(camera);
			allBlocks.push(...chunkBlocks);
		}

		console.log(`Total blocks to render: ${allBlocks.length}`);
		return allBlocks;
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
