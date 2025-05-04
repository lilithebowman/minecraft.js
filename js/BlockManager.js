import { BlockTypes } from './BlockTypes.js';
import { TextureManager } from './textures.js';
import { debug } from './debug.js';

export class BlockManager {
	constructor() {
		this.blocks = new Map();
		this.textureManager = new TextureManager();
	}

	async initialize() {
		debug.log('Initializing BlockManager...');
		await this.textureManager.initialize();
		return true;
	}

	createBlock(type, position) {
		const block = new Block(type, position);
		this.blocks.set(position.toString(), block);
		return block;
	}

	getBlock(position) {
		return this.blocks.get(position.toString());
	}

	removeBlock(position) {
		return this.blocks.delete(position.toString());
	}

	dispose() {
		this.blocks.clear();
		this.textureManager?.dispose();
	}
}