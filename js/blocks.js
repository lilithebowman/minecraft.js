import { TextureManager } from './modules.js';
import { BoxCollider } from './physics/boxCollider.js';
import * as THREE from 'three';
import { debug } from './debug.js';

export class BlockManager {
    constructor() {
        // Initialize blocks Map
        this.blocks = new Map();
        this.textureManager = new TextureManager();
        
        this.blockTypes = {
            'grass': { texture: 'grass_top' },
            'dirt': { texture: 'dirt' },
            'stone': { texture: 'stone' },
            'bedrock': { texture: 'bedrock', unbreakable: true } // Add unbreakable property
        };
    }

    async initialize() {
        console.log('Initializing block manager...');
        try {
            // Wait for texture manager to initialize
            await this.textureManager.initialize();
            console.log('Block manager initialized');
            return this;
        } catch (error) {
            console.error('Failed to initialize block manager:', error);
            throw error;
        }
        debug.log('BlockManager initialized');
    }
    
    update(deltaTime) {
        // Update the status display
        debug.updateStats({ blocks: this.getBlockCount() });
    }

    async addBlock(id, blockData) {
        if (this.blocks.has(id)) {
            throw new Error(`Block with ID ${id} already exists.`);
        }

        // Get the block type and its corresponding texture
        const blockType = blockData.type;
        if (!this.blockTypes[blockType]) {
            throw new Error(`Invalid block type: ${blockType}`);
        }

        // Get material for the block type
        const material = this.textureManager.getMaterial(this.blockTypes[blockType].texture);
        
        // Create collider for the block
        const collider = new BoxCollider(
            new THREE.Vector3(blockData.position.x + 0.5, blockData.position.y + 0.5, blockData.position.z + 0.5),
            new THREE.Vector3(1, 1, 1)
        );

        // Add material and collider to block data
        const enrichedBlockData = {
            ...blockData,
            material,
            collider
        };
    }

    getMaterial(blockType) {
        if (!this.blockTypes[blockType]) {
            throw new Error(`Invalid block type: ${blockType}`);
        }
        return this.textureManager.getMaterial(this.blockTypes[blockType].texture);
    }

    removeBlock(id) {
        if (!this.blocks.has(id)) {
            throw new Error(`Block with ID ${id} does not exist.`);
        }
        this.blocks.delete(id);
    }

    getBlock(id) {
        return this.blocks.get(id) || null;
    }

    getBlockCount() {
        return this.blocks.count;
    }

    listBlocks() {
        return Array.from(this.blocks.entries());
    }
}
