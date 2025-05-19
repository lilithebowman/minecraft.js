export class ChunkCache {
	constructor(maxSize) {
		this.cache = new Map();
		this.cacheOrder = [];
		this.maxSize = maxSize;
	}

	getChunk(chunkKey) {
		return this.cache.get(chunkKey);
	}

	addChunk(chunkKey, chunk) {
		if (this.cache.size >= this.maxSize) {
			this.evictOldestChunk();
		}
		this.cache.set(chunkKey, chunk);
		this.cacheOrder.push(chunkKey);
	}

	updateChunk(chunkKey) {
		const index = this.cacheOrder.indexOf(chunkKey);
		if (index > -1) {
			this.cacheOrder.splice(index, 1);
			this.cacheOrder.push(chunkKey);
		}
	}

	evictOldestChunk() {
		if (this.cache.size === 0) return;
		const oldestKey = this.cacheOrder.shift();
		if (oldestKey) {
			const chunk = this.cache.get(oldestKey);
			if (chunk) {
				chunk.dispose();
			}
			this.cache.delete(oldestKey);
		}
	}
}