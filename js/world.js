import { Block, Chunk, ChunkCache, ChunkLoader, NoiseGenerator, Frustum, isSolidBlockType } from './modules.js';
import * as THREE from 'three';
import { debug } from './debug.js';

export class World {
	static MAX_CACHE = 100;

	constructor(worldGroup = new THREE.Group()) {
		this.worldGroup = worldGroup;
		this.chunks = new Map();
		this.chunkCache = new ChunkCache(World.MAX_CACHE);
		this.chunkLoader = new ChunkLoader(this);
		this.chunkCacheEntriesOrder = []; // Initialize to avoid undefined errors
		this.block = new Block();
		this.chunkSize = 16;
		this.noiseGen = new NoiseGenerator();
		this.frustum = new Frustum();
		this.renderDistance = 1;
		this.chunkLoadQueue = [];
		this.maxConcurrentLoads = 4;
		this.loadingDiv = null;
		this.totalBlocks = 0;
		this.workers = [];
		this.maxWorkers = navigator.hardwareConcurrency || 4;
		this.visibleBlocks = [];
		this.visibleChunks = new Set();
		this.rotation = new THREE.Vector3(0, 0, 0);
		this.player = null;
		this.lastPlayerChunkX = 0;
		this.lastPlayerChunkZ = 0;
		this.debugMode = true;
		this.chunkUpdateTimer = 0;
		this.chunkUpdateCooldown = 1.0;
		this.memoryUsage = 0;
		this.chunkLoadingPriorityQueue = [];
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

		this.loadingDiv = this.createChunkLoadingDisplay();

		try {
			await this.updateChunksAroundPlayer();

			console.log(`Generated ${this.chunks.size} chunks`);
		} catch (error) {
			console.error('Error generating world:', error);
			throw error;
		} finally {
			if (this.loadingDiv) {
				this.loadingDiv.remove();
			}
		}
	}

	getChunkCoordinates(x, z) {
		return {
			x: Math.floor(x / this.chunkSize),
			z: Math.floor(z / this.chunkSize)
		};
	}

	async updateChunksAroundPlayer(player) {
		if (!player) {
			return 0;
		}

		const playerChunk = this.getChunkCoordinates(player.position.x, player.position.z);
		const radius = this.renderDistance;
		const newChunks = await this.loadChunksInArea(playerChunk.x, playerChunk.z, radius);

		return newChunks;
	}

	async loadChunksInArea(centerX, centerZ, radius) {
		const chunksToLoad = [];
		const frustum = this.frustum;

		for (let x = centerX - radius; x <= centerX + radius; x++) {
			for (let z = centerZ - radius; z <= centerZ + radius; z++) {
				const chunkKey = `${x},${z}`;

				if (this.chunks.has(chunkKey)) continue;

				const chunkPosition = new THREE.Vector3(
					x * this.chunkSize + this.chunkSize / 2,
					0,
					z * this.chunkSize + this.chunkSize / 2
				);

				// Pass chunk indices, not world coordinates
				if (!frustum.isChunkVisible({ x, z })) continue;

				chunksToLoad.push({ x, z, distance: Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2) });
			}
		}

		chunksToLoad.sort((a, b) => a.distance - b.distance);

		if (chunksToLoad.length > 0) {
			return await this.backgroundLoadChunks(chunksToLoad);
		}
		return 0;
	}

	async backgroundLoadChunks(chunksToLoad) {
		let loadedChunks = 0;
		for (const chunkData of chunksToLoad) {
			const { x, z } = chunkData;
			const chunkKey = `${x},${z}`;

			if (!this.chunks.has(chunkKey)) {
				const chunk = new Chunk(x, z);
				await chunk.initialize();
				this.chunks.set(chunkKey, chunk);
				this.updateMemoryUsage();
				loadedChunks++;
			}
		}

		return loadedChunks;
	}

	addBlock(x, y, z, type) {
		const chunk = this.getOrCreateChunk(
			Math.floor(x / this.chunkSize),
			Math.floor(z / this.chunkSize)
		);
		const localX = x & (this.chunkSize - 1);
		const localZ = z & (this.chunkSize - 1);
		chunk.setBlock(localX, y, localZ, type);
	}

	async getOrCreateChunk(chunkX, chunkZ) {
		const chunkKey = `${chunkX},${chunkZ}`;
		const chunk = this.chunkCache.getChunk(chunkKey);
		if (chunk) {
			this.chunkCache.updateChunk(chunkKey);
			return chunk;
		}

		const newChunk = await this.chunkLoader.loadChunk(chunkX, chunkZ);
		this.chunks.set(chunkKey, newChunk);
		this.chunkCache.addChunk(chunkKey, newChunk);
		return newChunk;
	}

	// Get a chunk from cache or create it if it doesn't exist
	getChunk(chunkX, chunkZ) {
		const key = `${chunkX},${chunkZ}`;
		if (!this.chunkCache || this.chunkCache.size === 0 || typeof this.chunkCache.get !== 'function') {
			console.error('Chunk cache is not initialized or invalid');
			return undefined;
		}
		const chunk = this.chunkCache.get(key);
		if (chunk) {
			// Move to end of order to mark as recently used
			this.chunkCacheEntriesOrder = this.chunkCacheEntriesOrder.filter(entry => entry !== key);
			this.chunkCacheEntriesOrder.push(key);
		}
		return chunk;
	}

	// Get all chunks in the world
	getChunks() {
		return Array.from(this.chunks.values());
	}

	// Get an individual block by its world coordinates
	getBlock(x, y, z) {
		const chunkX = Math.floor(x / this.chunkSize);
		const chunkZ = Math.floor(z / this.chunkSize);
		const chunk = this.getChunk(chunkX, chunkZ);

		if (!chunk) return undefined;

		const localX = x & (this.chunkSize - 1);
		const localZ = z & (this.chunkSize - 1);

		return chunk.getBlock(localX, y, localZ);
	}

	// Set an individual block by its world coordinates
	setBlock(x, y, z, type) {
		const chunkX = Math.floor(x / this.chunkSize);
		const chunkZ = Math.floor(z / this.chunkSize);
		const chunk = this.getOrCreateChunk(chunkX, chunkZ);
		const localX = x & (this.chunkSize - 1);
		const localZ = z & (this.chunkSize - 1);
		chunk.setBlock(localX, y, localZ, type);
	}

	// Update chunks around the player based on their position
	update(deltaTime) {
		for (const chunk of this.chunks.values()) {
			if (chunk.needsUpdate) {
				chunk.isDirty = true;
				chunk.needsUpdate = false;
			}
		}

		this.chunkUpdateTimer += deltaTime;
		if (this.chunkUpdateTimer > this.chunkUpdateCooldown && this.player) {
			this.chunkUpdateTimer = 0;

			const currentChunkX = Math.floor(this.player.position.x / this.chunkSize);
			const currentChunkZ = Math.floor(this.player.position.z / this.chunkSize);

			if (currentChunkX !== this.lastPlayerChunkX ||
				currentChunkZ !== this.lastPlayerChunkZ) {

				console.log(`Player moved to chunk (${currentChunkX}, ${currentChunkZ})`);
				this.updateChunksAroundPlayer(this.player);

				this.lastPlayerChunkX = currentChunkX;
				this.lastPlayerChunkZ = currentChunkZ;
			}
		}
	}

	createChunkLoadingDisplay() {
		if (this.loadingDiv) {
			return this.loadingDiv;
		}

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

	updateChunkLoadingDisplay(loadedChunks, totalChunks) {
		this.loadingDiv.innerText = `Loading chunks... ${loadedChunks}/${totalChunks}`;
		if (loadedChunks === totalChunks) {
			this.loadingDiv.innerText = 'Chunks loaded!';
		}
	}

	getVisibleChunks(player) {
		if (!player) {
			console.error('Player is not defined in world');
			debugger;
		}
		this.chunks.forEach(chunk => {
			const distance = this.getChunkDistanceToCamera(chunk, player.getCamera());
			if (distance < this.renderDistance * this.renderDistance) {
				this.visibleChunks.add(chunk);
			} else {
				this.visibleChunks.delete(chunk);
			}
		});
		this.frustum?.update(player.getCamera());
		this.visibleChunks.forEach(chunk => {
			if (!this.frustum.isVisible(chunk) || !chunk.isOccluded(player.getCamera())) {
				this.visibleChunks.delete(chunk);
			}
		});
		return Array.from(this.visibleChunks);
	}

	getChunkDistanceToCamera(chunk, camera) {
		const chunkCenter = {
			x: chunk.x * this.chunkSize + this.chunkSize / 2,
			z: chunk.z * this.chunkSize + this.chunkSize / 2
		};
		const dx = chunkCenter.x - camera.position.x;
		const dz = chunkCenter.z - camera.position.z;
		return dx * dx + dz * dz;
	}

	findNearestBlock(position) {
		let nearestBlock = null;
		let minDistance = Infinity;

		for (const [key, chunk] of this.chunks) {
			for (let x = 0; x < chunk.size; x++) {
				for (let y = 0; y < chunk.height; y++) {
					for (let z = 0; z < chunk.size; z++) {
						const blockType = chunk.getBlock(x, y, z);

						if (!blockType) continue;

						const worldX = chunk.x * this.chunkSize + x;
						const worldZ = chunk.z * this.chunkSize + z;
						const blockPosition = { x: worldX, y, z: worldZ };

						const dx = position.x - blockPosition.x;
						const dy = position.y - blockPosition.y;
						const dz = position.z - blockPosition.z;
						const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

						if (distance < minDistance) {
							minDistance = distance;
							nearestBlock = {
								type: blockType,
								position: blockPosition,
								isSolid: isSolidBlockType(blockType)
							};
						}
					}
				}
			}
		}

		return nearestBlock;
	}

	getLoadedChunks() {
		return this.chunks;
	}

	dispose() {
		if (this.chunks.size > 0) {
			for (const [key, chunk] of this.chunks) {
				chunk.dispose();
			}
			this.chunks.clear();
		}
		this.workers.forEach(worker => worker.terminate());
		this.workers = [];
		this.block = null;
		this.noiseGen = null;
		if (this.loadingDiv) {
			this.loadingDiv.remove();
			this.loadingDiv = null;
		}
	}

	async initialize() {
		try {
			await this.generateWorld();
			// position the player at the top of the terrain
			if (!this.player) {
				throw new Error('Player is not defined in world');
			}
			let topBlock = this.getTopBlockAt(0, 0);
			if (!topBlock) {
				topBlock = { y: 64 }; // Default to 64 if no top block found
			}
			this.player?.position.set(0, topBlock.y + 1, 0);
			return true;
		} catch (error) {
			console.error('World initialization failed:', error);
			this.dispose();
			throw error;
		}
	}

	removeChunkLoadingDisplay() {
		if (this.loadingDiv) {
			this.loadingDiv.remove();
			this.loadingDiv = null;
		}
	}

	enableDebug() {
		this.debugMode = true;
		this.stats = {
			chunksLoaded: 0,
			chunksVisible: 0,
			blocksDrawn: 0,
			lastUpdateTime: 0,
			performance: {
				updateTime: 0,
				chunkLoadTime: 0
			}
		};
	}

	updateDebugStats() {
		if (!this.debugMode) return;

		this.stats.chunksLoaded = this.chunks.size;
		this.stats.blocksDrawn = this.countBlocks();
		this.stats.chunksVisible = this.visibleChunks.size;

		// Track update performance
		const updateTime = performance.now() - this.stats.lastUpdateTime;
		this.stats.performance.updateTime = updateTime;
		this.stats.lastUpdateTime = performance.now();
		debug.updateStats(this.stats);
	}

	setPlayer(player) {
		if (!player) {
			console.warn('Attempted to set null player in World');
			return;
		}

		this.player = player;
		console.log('Player set in World, initializing chunks around player position');

		this.updateChunksAroundPlayer(player);

		this.lastPlayerChunkX = Math.floor(player.position.x / this.chunkSize);
		this.lastPlayerChunkZ = Math.floor(player.position.z / this.chunkSize);
	}

	updateVisibleChunks() {
		const currentViewChunks = this.getChunksAroundPlayer();
		const chunksToRemove = Array.from(this.chunks.keys()).filter(
			chunkKey => !currentViewChunks.includes(chunkKey)
		);

		chunksToRemove.forEach(chunkKey => {
			const chunk = this.chunks.get(chunkKey);
			if (chunk) {
				chunk.dispose();
				this.chunks.delete(chunkKey);
				this.chunkCache.delete(chunkKey);
				this.updateMemoryUsage();
			}
		});
	}

	getChunksAroundPlayer() {
		const playerChunk = this.getChunkCoordinates(this.player.position.x, this.player.position.z);
		const radius = this.renderDistance;
		const currentViewChunks = [];

		for (let x = playerChunk.x - radius; x <= playerChunk.x + radius; x++) {
			for (let z = playerChunk.z - radius; z <= playerChunk.z + radius; z++) {
				currentViewChunks.push(`${x},${z}`);
			}
		}

		return currentViewChunks;
	}

	updateMemoryUsage() {
		let totalMemory = 0;
		for (const chunk of this.chunks.values()) {
			totalMemory += chunk.memoryUsed;
		}
		this.memoryUsage = totalMemory;
	}

	countBlocks() {
		let blockCount = 0;
		for (const chunk of this.chunks.values()) {
			blockCount += chunk.countBlocks();
		}
		return blockCount;
	}

	// Add chunk position helper functions
	getChunkMin(chunk) {
		return {
			x: chunk.x * this.chunkSize,
			z: chunk.z * this.chunkSize
		};
	}

	getChunkMax(chunk) {
		return {
			x: chunk.x * this.chunkSize + this.chunkSize,
			z: chunk.z * this.chunkSize + this.chunkSize
		};
	}

	// Add chunk center position
	getChunkCenter(chunk) {
		return {
			x: chunk.x * this.chunkSize + this.chunkSize / 2,
			z: chunk.z * this.chunkSize + this.chunkSize / 2
		};
	}

	// Add position to chunk helper
	positionToChunk(x, z) {
		return {
			x: Math.floor(x / this.chunkSize),
			z: Math.floor(z / this.chunkSize)
		};
	}

	// Get the position of the top block at the given coordinates
	getTopBlockAt(x, z) {
		const chunkX = Math.floor(x / this.chunkSize);
		const chunkZ = Math.floor(z / this.chunkSize);
		const chunk = this.getChunk(chunkX, chunkZ);

		if (!chunk) return null;

		const localX = x & (this.chunkSize - 1);
		const localZ = z & (this.chunkSize - 1);

		return chunk.getTopBlockAt(localX, localZ);
	}

	// Get the position of the bottom block at the given coordinates
	getBottomBlockAt(x, z) {
		const chunkX = Math.floor(x / this.chunkSize);
		const chunkZ = Math.floor(z / this.chunkSize);
		const chunk = this.getChunk(chunkX, chunkZ);

		if (!chunk) return null;

		const localX = x & (this.chunkSize - 1);
		const localZ = z & (this.chunkSize - 1);

		return chunk.getBottomBlockAt(localX, localZ);
	}
}
