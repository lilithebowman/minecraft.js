import { Chunk } from '../components/Chunk.js';
import { Vector3 } from '../utils/Vector3.js';

/**
 * World class - Manages chunks and world generation
 */
export class World {
	constructor(element) {
		this.element = element;
		this.chunks = new Map();
		this.chunkSize = 16;
		this.renderDistance = 2; // Further reduced for better performance
		this.worldSeed = Math.random() * 1000000;

		// Chunk management with limits
		this.chunkLoadQueue = [];
		this.chunkUnloadQueue = [];
		this.maxChunksPerFrame = 1;
		this.maxConcurrentChunks = 9; // 3x3 grid limit
		this.maxChunksTotal = 25; // Hard limit on total chunks

		// World generation parameters
		this.seaLevel = 24; // Reduced
		this.maxHeight = 64; // Reduced

		// Performance tracking
		this.lastChunkUpdate = 0;
		this.chunkUpdateInterval = 200; // Increased interval
		this.isGenerating = false;
		this.generationQueue = [];
	}

	/**
	 * Initialize the world
	 */
	async initialize() {
		console.log('Initializing world...');

		// Set up world element
		if (this.element) {
			this.element.style.position = 'absolute';
			this.element.style.transformStyle = 'preserve-3d';
		}

		// Generate initial chunks around spawn
		await this.generateInitialChunks();

		console.log('World initialized successfully');
	}

	/**
	 * Generate initial chunks around spawn point with parallelization
	 */
	async generateInitialChunks() {
		const spawnChunkX = 0;
		const spawnChunkZ = 0;
		const initialRadius = 1; // Reduced from 2

		console.log('Generating initial chunks (optimized)...');

		// Generate chunks in parallel batches
		const chunkPromises = [];
		for (let x = spawnChunkX - initialRadius; x <= spawnChunkX + initialRadius; x++) {
			for (let z = spawnChunkZ - initialRadius; z <= spawnChunkZ + initialRadius; z++) {
				chunkPromises.push(this.loadChunk(x, z));
			}
		}

		// Wait for all chunks to be generated
		await Promise.all(chunkPromises);

		console.log(`Generated ${this.chunks.size} initial chunks`);
	}

	/**
	 * Update world based on player position (optimized)
	 */
	update(player, deltaTime) {
		const now = performance.now();

		// Limit chunk updates for performance
		if (now - this.lastChunkUpdate < this.chunkUpdateInterval) {
			return;
		}

		const playerPos = player.getPosition();
		const playerChunk = this.getChunkCoordinates(playerPos);

		// Only update if player moved to a different chunk
		if (!this.lastPlayerChunk || 
			this.lastPlayerChunk.x !== playerChunk.x || 
			this.lastPlayerChunk.z !== playerChunk.z) {
			
			// Load chunks around player
			this.updateChunkLoadingOptimized(playerChunk);
		}

		// Process chunk loading/unloading queues
		this.processChunkQueues();

		// Update existing chunks (limited)
		this.updateChunksOptimized();

		this.lastChunkUpdate = now;
		this.lastPlayerChunk = playerChunk;
	}

	/**
	 * Update chunk loading around player (optimized)
	 */
	updateChunkLoadingOptimized(playerChunk) {
		const { x: centerX, z: centerZ } = playerChunk;

		// Early exit if we have too many chunks
		if (this.chunks.size >= this.maxChunksTotal) {
			return;
		}

		// Queue chunks for loading (limited)
		let queuedChunks = 0;
		for (let x = centerX - this.renderDistance; x <= centerX + this.renderDistance; x++) {
			for (let z = centerZ - this.renderDistance; z <= centerZ + this.renderDistance; z++) {
				if (queuedChunks >= this.maxConcurrentChunks) break;

				const chunkKey = `${x},${z}`;

				if (!this.chunks.has(chunkKey)) {
					const distance = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);

					if (distance <= this.renderDistance) {
						this.chunkLoadQueue.push({ x, z, distance });
						queuedChunks++;
					}
				}
			}
		}

		// Queue distant chunks for unloading (aggressive)
		const unloadDistance = this.renderDistance + 0.5;
		for (const [chunkKey, chunk] of this.chunks) {
			const [x, z] = chunkKey.split(',').map(Number);
			const distance = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);

			if (distance > unloadDistance) {
				this.chunkUnloadQueue.push(chunk);
			}
		}

		// Sort load queue by distance (closest first)
		this.chunkLoadQueue.sort((a, b) => a.distance - b.distance);
	}

	/**
	 * Process chunk loading and unloading queues (optimized)
	 */
	processChunkQueues() {
		// Process chunk unloading first (to free memory)
		let chunksUnloaded = 0;
		while (this.chunkUnloadQueue.length > 0 && chunksUnloaded < this.maxChunksPerFrame) {
			const chunk = this.chunkUnloadQueue.shift();
			this.unloadChunk(chunk);
			chunksUnloaded++;
		}

		// Process chunk loading (if not already generating)
		if (!this.isGenerating && this.chunkLoadQueue.length > 0) {
			const { x, z } = this.chunkLoadQueue.shift();
			this.loadChunkAsync(x, z);
		}
	}

	/**
	 * Load a chunk asynchronously
	 */
	async loadChunkAsync(x, z) {
		const chunkKey = `${x},${z}`;

		if (this.chunks.has(chunkKey) || this.isGenerating) {
			return;
		}

		this.isGenerating = true;

		try {
			const chunk = await this.loadChunk(x, z);
			return chunk;
		} finally {
			this.isGenerating = false;
		}
	}

	/**
	 * Load a chunk at the given coordinates (optimized)
	 */
	async loadChunk(x, z) {
		const chunkKey = `${x},${z}`;

		if (this.chunks.has(chunkKey)) {
			return this.chunks.get(chunkKey);
		}

		// Check chunk limit
		if (this.chunks.size >= this.maxChunksTotal) {
			console.warn('Chunk limit reached, skipping chunk generation');
			return null;
		}

		console.log(`Loading chunk at ${x}, ${z} (optimized)`);

		// Create new chunk
		const chunk = new Chunk(x, z, this.chunkSize);

		// Generate terrain asynchronously
		await chunk.generate(this.worldSeed);

		// Add to DOM
		chunk.addToDOM(this.element);

		// Store chunk
		this.chunks.set(chunkKey, chunk);

		return chunk;
	}

	/**
	 * Update existing chunks (optimized)
	 */
	updateChunksOptimized() {
		let chunksUpdated = 0;
		const maxUpdatesPerFrame = 3;

		for (const chunk of this.chunks.values()) {
			if (chunksUpdated >= maxUpdatesPerFrame) break;

			chunk.update();
			chunksUpdated++;
		}
	}

	/**
	 * Unload a chunk
	 */
	unloadChunk(chunk) {
		const chunkKey = `${chunk.x},${chunk.z}`;

		if (this.chunks.has(chunkKey)) {
			console.log(`Unloading chunk at ${chunk.x}, ${chunk.z}`);

			chunk.dispose();
			this.chunks.delete(chunkKey);
		}
	}

	/**
	 * Update all loaded chunks
	 */
	updateChunks() {
		this.updateChunksOptimized();
	}

	/**
	 * Render the world
	 */
	render() {
		// Chunks handle their own rendering through CSS transforms
		// This method is here for future enhancements
	}

	/**
	 * Get chunk coordinates for a world position
	 */
	getChunkCoordinates(worldPosition) {
		return {
			x: Math.floor(worldPosition.x / this.chunkSize),
			z: Math.floor(worldPosition.z / this.chunkSize)
		};
	}

	/**
	 * Get chunk at world position
	 */
	getChunkAt(worldPosition) {
		const chunkCoords = this.getChunkCoordinates(worldPosition);
		const chunkKey = `${chunkCoords.x},${chunkCoords.z}`;
		return this.chunks.get(chunkKey) || null;
	}

	/**
	 * Get block at world position
	 */
	getBlockAt(worldPosition) {
		const chunk = this.getChunkAt(worldPosition);
		if (!chunk) return null;

		const chunkCoords = this.getChunkCoordinates(worldPosition);
		const localX = Math.floor(worldPosition.x) - (chunkCoords.x * this.chunkSize);
		const localZ = Math.floor(worldPosition.z) - (chunkCoords.z * this.chunkSize);
		const localY = Math.floor(worldPosition.y);

		return chunk.getBlock(localX, localY, localZ);
	}

	/**
	 * Set block at world position
	 */
	setBlockAt(worldPosition, blockType) {
		const chunk = this.getChunkAt(worldPosition);
		if (!chunk) return false;

		const chunkCoords = this.getChunkCoordinates(worldPosition);
		const localX = Math.floor(worldPosition.x) - (chunkCoords.x * this.chunkSize);
		const localZ = Math.floor(worldPosition.z) - (chunkCoords.z * this.chunkSize);
		const localY = Math.floor(worldPosition.y);

		chunk.setBlock(localX, localY, localZ, blockType);
		return true;
	}

	/**
	 * Remove block at world position
	 */
	removeBlockAt(worldPosition) {
		const chunk = this.getChunkAt(worldPosition);
		if (!chunk) return false;

		const chunkCoords = this.getChunkCoordinates(worldPosition);
		const localX = Math.floor(worldPosition.x) - (chunkCoords.x * this.chunkSize);
		const localZ = Math.floor(worldPosition.z) - (chunkCoords.z * this.chunkSize);
		const localY = Math.floor(worldPosition.y);

		chunk.removeBlock(localX, localY, localZ);
		return true;
	}

	/**
	 * Get terrain height at world coordinates
	 */
	getHeightAt(worldX, worldZ) {
		const worldPos = new Vector3(worldX, 0, worldZ);
		const chunk = this.getChunkAt(worldPos);

		if (!chunk) return this.seaLevel;

		const chunkCoords = this.getChunkCoordinates(worldPos);
		const localX = Math.floor(worldX) - (chunkCoords.x * this.chunkSize);
		const localZ = Math.floor(worldZ) - (chunkCoords.z * this.chunkSize);

		return chunk.getHeightAt(localX, localZ);
	}

	/**
	 * Get world statistics
	 */
	getStats() {
		return {
			chunkCount: this.chunks.size,
			loadQueueSize: this.chunkLoadQueue.length,
			unloadQueueSize: this.chunkUnloadQueue.length,
			renderDistance: this.renderDistance,
			worldSeed: this.worldSeed
		};
	}

	/**
	 * Get chunk count
	 */
	getChunkCount() {
		return this.chunks.size;
	}

	/**
	 * Get all loaded chunks
	 */
	getAllChunks() {
		return Array.from(this.chunks.values());
	}

	/**
	 * Check if chunk is loaded
	 */
	isChunkLoaded(x, z) {
		const chunkKey = `${x},${z}`;
		return this.chunks.has(chunkKey);
	}

	/**
	 * Force reload a chunk
	 */
	reloadChunk(x, z) {
		const chunkKey = `${x},${z}`;
		const existingChunk = this.chunks.get(chunkKey);

		if (existingChunk) {
			this.unloadChunk(existingChunk);
		}

		return this.loadChunk(x, z);
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		console.log('Disposing world...');

		// Dispose all chunks
		for (const chunk of this.chunks.values()) {
			chunk.dispose();
		}

		// Clear data structures
		this.chunks.clear();
		this.chunkLoadQueue = [];
		this.chunkUnloadQueue = [];

		// Clear element
		if (this.element) {
			this.element.innerHTML = '';
		}

		console.log('World disposed');
	}
}
