import { Block, Chunk, NoiseGenerator, Frustum, isSolidBlockType } from './modules.js';
import * as THREE from 'three';
import { debug } from './debug.js';

export class World {
	constructor(worldGroup = new THREE.Group()) {
		this.block = new Block();
		this.chunks = new Map();
		this.chunkSize = 16; // Standard chunk size
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
		this.worldGroup = worldGroup;
		this.debugMode = true;
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
			// Initialize with just the chunks near the player
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

	// New method to update chunks based on player position
	async updateChunksAroundPlayer(player) {
		if (!player) {
			// Use origin coordinates as fallback if no player is provided
-			return this.loadChunksInArea(0, 0, 1);
+			return this.loadChunksInArea(0, 0, this.renderDistance);
		}

		// Convert player position to chunk coordinates
		const chunkX = Math.floor(player.position.x / this.chunkSize);
		const chunkZ = Math.floor(player.position.z / this.chunkSize);

		// Load chunks around player
-		return this.loadChunksInArea(chunkX, chunkZ, 1);
+		return this.loadChunksInArea(chunkX, chunkZ, this.renderDistance);
	}

	// New method to load chunks in a specific area
	async loadChunksInArea(centerX, centerZ, radius) {
		console.log(`Loading chunks around (${centerX}, ${centerZ}) with radius ${radius}`);

		// Keep track of which chunks should remain loaded
		const chunksToKeep = new Set();
		let newChunksLoaded = 0;

		// Load all chunks within specified radius
		for (let x = centerX - radius; x <= centerX + radius; x++) {
			for (let z = centerZ - radius; z <= centerZ + radius; z++) {
				const chunkKey = `${x},${z}`;
				chunksToKeep.add(chunkKey);

				// Skip if chunk already exists
				if (this.chunks.has(chunkKey)) continue;

				// Create and initialize new chunk
				const chunk = new Chunk(x, z);
				await chunk.initialize();
				this.chunks.set(chunkKey, chunk);
				newChunksLoaded++;

				// Update loading display if needed
				if (this.loadingDiv) {
					this.updateChunkLoadingDisplay(newChunksLoaded, (radius * 2 + 1) * (radius * 2 + 1));
				}
			}
		}

		// Unload chunks that are too far away
		for (const [chunkKey, chunk] of this.chunks.entries()) {
			if (!chunksToKeep.has(chunkKey)) {
				// Dispose of the chunk resources
				chunk.dispose();
				this.chunks.delete(chunkKey);
				console.log(`Unloaded distant chunk at ${chunkKey}`);
			}
		}

		return newChunksLoaded;
	}

	addBlock(x, y, z, type) {
		const chunk = this.getOrCreateChunk(Math.floor(x / this.chunkSize), Math.floor(z / this.chunkSize));
		const blockId = `${x},${y},${z}`;

		// Update block manager
		if (type) {
			chunk.addBlock(blockId, {
				type,
				position: { x, y, z }
			});
		} else {
			chunk.removeBlock(blockId);
		}

		// Update chunk
		chunk.setBlock(x & (this.chunkSize - 1), y, z & (this.chunkSize - 1), type);
		chunk.needsUpdate = true;
		this.chunks.set(`${chunk.x},${chunk.z}`, chunk);
		this.totalBlocks += chunk.size * chunk.size * chunk.height;
	}

	getOrCreateChunk(chunkX, chunkZ) {
		const key = `${chunkX},${chunkZ}`;
		let chunk = this.chunks.get(key);

		if (!chunk) {
			chunk = new Chunk(chunkX, chunkZ);
			this.chunks.set(key, chunk);
			chunk.needsUpdate = true;
			console.log(`Created new chunk at ${chunkX}, ${chunkZ}`);
		}

		return chunk;
	}

	getChunk(chunkX, chunkZ) {
		return this.chunks.get(`${chunkX},${chunkZ}`);
	}
	getChunks() {
		return Array.from(this.chunks.values());
	}

	getBlock(x, y, z) {
		const chunk = this.getChunk(Math.floor(x / this.chunkSize), Math.floor(z / this.chunkSize));
		return chunk?.getBlock(x & (this.chunkSize - 1), y, z & (this.chunkSize - 1));
	}
	setBlock(x, y, z, type) {
		const chunkX = Math.floor(x / this.chunkSize);
		const chunkZ = Math.floor(z / this.chunkSize);
		const chunk = this.getOrCreateChunk(chunkX, chunkZ);

		// Convert to local chunk coordinates
		const localX = x & (this.chunkSize - 1);
		const localZ = z & (this.chunkSize - 1);

		// Set the block
		chunk.setBlock(localX, y, localZ, type);
		chunk.needsUpdate = true;
	}

	update(deltaTime) {
		// Update chunks that need updating
		for (const chunk of this.chunks.values()) {
			if (chunk.needsUpdate) {
				chunk.isDirty = true;
				chunk.needsUpdate = false;
			}
		}

// In your class definition...

constructor(worldGroup = new THREE.Group()) {
    // ... existing code ...
    this.debugMode = true;
    this.chunkUpdateTimer = 0;
    this.lastPlayerChunkX = null;
    this.lastPlayerChunkZ = null;
    this.chunkUpdateCooldown = 1.0; // seconds between chunk updates
}

update(deltaTime) {
    // ... existing code ...

    // Every 1 second, check if we need to update chunks around the player
    this.chunkUpdateTimer += deltaTime;
    if (this.chunkUpdateTimer > this.chunkUpdateCooldown && this.player) {
        this.chunkUpdateTimer = 0;

        // Get the player's current chunk
        const currentChunkX = Math.floor(this.player.position.x / this.chunkSize);
        const currentChunkZ = Math.floor(this.player.position.z / this.chunkSize);

        // Check if player moved to a different chunk
        if (currentChunkX !== this.lastPlayerChunkX ||
            currentChunkZ !== this.lastPlayerChunkZ) {

            console.log(`Player moved to chunk (${currentChunkX}, ${currentChunkZ})`);
            this.updateChunksAroundPlayer(this.player);

            // Update last known player chunk
            this.lastPlayerChunkX = currentChunkX;
            this.lastPlayerChunkZ = currentChunkZ;
        }
    }
}
	}

	// Crate a chunk loading display in the middle of the canvas
	createChunkLoadingDisplay() {
		if (this.loadingDiv) {
			// Don't create multiple loading divs
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

	// Update the chunk loading display
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
		// Update frustum and remove chunks that are not visible
		this.frustum?.update(player.getCamera());
		this.visibleChunks.forEach(chunk => {
			if (!this.frustum.isVisible(chunk)) {
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
						const worldX = chunk.x * this.chunkSize + x;
						const worldZ = chunk.z * this.chunkSize + z;
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

	async initialize() {
		try {
			await this.generateWorld();
			return true;
		} catch (error) {
			console.error('World initialization failed:', error);
			this.dispose(); // Clean up workers on error
			throw error;
		}
	}

	// remove chunk loading display
	removeChunkLoadingDisplay() {
		if (this.loadingDiv) {
			this.loadingDiv.remove();
			this.loadingDiv = null;
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
