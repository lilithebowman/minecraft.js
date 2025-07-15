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
		this.renderDistance = 3; // Reduced for better performance
		this.worldSeed = Math.random() * 1000000;

		// Chunk management
		this.chunkLoadQueue = [];
		this.chunkUnloadQueue = [];
		this.maxChunksPerFrame = 1;

		// World generation parameters
		this.seaLevel = 32;
		this.maxHeight = 128;

		// Performance tracking
		this.lastChunkUpdate = 0;
		this.chunkUpdateInterval = 100; // ms
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
	 * Generate initial chunks around spawn point
	 */
	async generateInitialChunks() {
		const spawnChunkX = 0;
		const spawnChunkZ = 0;
		const initialRadius = 2;

		console.log('Generating initial chunks...');

		for (let x = spawnChunkX - initialRadius; x <= spawnChunkX + initialRadius; x++) {
			for (let z = spawnChunkZ - initialRadius; z <= spawnChunkZ + initialRadius; z++) {
				await this.loadChunk(x, z);
			}
		}

		console.log(`Generated ${this.chunks.size} initial chunks`);
	}

	/**
	 * Update world based on player position
	 */
	update(player, deltaTime) {
		const now = performance.now();

		// Limit chunk updates for performance
		if (now - this.lastChunkUpdate < this.chunkUpdateInterval) {
			return;
		}

		const playerPos = player.getPosition();
		const playerChunk = this.getChunkCoordinates(playerPos);

		// Load chunks around player
		this.updateChunkLoading(playerChunk);

		// Process chunk loading/unloading queues
		this.processChunkQueues();

		// Update existing chunks
		this.updateChunks();

		this.lastChunkUpdate = now;
	}

	/**
	 * Update chunk loading around player
	 */
	updateChunkLoading(playerChunk) {
		const { x: centerX, z: centerZ } = playerChunk;

		// Queue chunks for loading
		for (let x = centerX - this.renderDistance; x <= centerX + this.renderDistance; x++) {
			for (let z = centerZ - this.renderDistance; z <= centerZ + this.renderDistance; z++) {
				const chunkKey = `${x},${z}`;

				if (!this.chunks.has(chunkKey)) {
					const distance = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);

					if (distance <= this.renderDistance) {
						this.chunkLoadQueue.push({ x, z, distance });
					}
				}
			}
		}

		// Queue distant chunks for unloading
		const unloadDistance = this.renderDistance + 1;
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
	 * Process chunk loading and unloading queues
	 */
	processChunkQueues() {
		// Process chunk loading
		let chunksLoaded = 0;
		while (this.chunkLoadQueue.length > 0 && chunksLoaded < this.maxChunksPerFrame) {
			const { x, z } = this.chunkLoadQueue.shift();
			this.loadChunk(x, z);
			chunksLoaded++;
		}

		// Process chunk unloading
		let chunksUnloaded = 0;
		while (this.chunkUnloadQueue.length > 0 && chunksUnloaded < this.maxChunksPerFrame) {
			const chunk = this.chunkUnloadQueue.shift();
			this.unloadChunk(chunk);
			chunksUnloaded++;
		}
	}

	/**
	 * Load a chunk at the given coordinates
	 */
	async loadChunk(x, z) {
		const chunkKey = `${x},${z}`;

		if (this.chunks.has(chunkKey)) {
			return this.chunks.get(chunkKey);
		}

		console.log(`Loading chunk at ${x}, ${z}`);

		// Create new chunk
		const chunk = new Chunk(x, z, this.chunkSize);

		// Generate terrain
		chunk.generate(this.worldSeed);

		// Add to DOM
		chunk.addToDOM(this.element);

		// Update chunk rendering
		chunk.update();

		// Store chunk
		this.chunks.set(chunkKey, chunk);

		return chunk;
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
		for (const chunk of this.chunks.values()) {
			chunk.update();
		}
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
