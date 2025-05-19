import { NoiseGenerator, Block, Chunk } from './modules.js';

export class ChunkLoader {
	constructor(world) {
		this.world = world;
		this.worldChunkSize = 16;
	}

	async loadChunk(chunkX, chunkZ) {
		const terrain = await this.generateTerrain(chunkX, chunkZ);
		const blocks = this.createBlocksArray(chunkX, chunkZ, terrain);
		return new Chunk(chunkX, chunkZ, blocks);
	}

	async generateTerrain(chunkX, chunkZ) {
		// Implementation from world.js
		const noiseGen = new NoiseGenerator();
		const blocks = [];
		const scale = 50;
		const amplitude = 20;
		const baseHeight = 10;

		for (let x = 0; x < 16; x++) {
			for (let z = 0; z < 16; z++) {
				const worldX = chunkX * 16 + x;
				const worldZ = chunkZ * 16 + z;

				let height = noiseGen.noise(worldX / scale, 0, worldZ / scale) * amplitude + baseHeight;
				height = Math.floor(height);

				for (let y = 0; y < height; y++) {
					const blockType = this.getBlockTypeAtHeight(y, height);
					blocks.push(new Block(blockType, { x, y, z }));
				}
			}
		}
		return blocks;
	}

	createBlocksArray(chunkX, chunkZ, blocks) {
		const chunkBlocks = new Map();
		for (const block of blocks) {
			chunkBlocks.set(`${block.x},${block.y},${block.z}`, block);
		}
		return chunkBlocks;
	}

	getBlockTypeAtHeight(y, height) {
		if (y === 0) return 'bedrock';
		else if (y < height - 4) return 'stone';
		else if (y < height - 1) return 'dirt';
		else return 'grass';
	}

	async unloadChunk(chunk) {
		chunk.dispose();
		return true;
	}
}