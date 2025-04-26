import { TextureManager } from './modules.js';
import { BoxCollider } from './physics/boxCollider.js';
import * as THREE from 'three';

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
        this.createDisplay();
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
    }

    createDisplay() {
        this.display = document.createElement('div');
        this.display.style.position = 'fixed';
        this.display.style.top = '30px';  // Position below framerate counter
        this.display.style.right = '10px';
        this.display.style.color = 'white';
        this.display.style.fontFamily = 'monospace';
        this.display.style.fontSize = '16px';
        this.display.style.zIndex = '100';
        document.body.appendChild(this.display);
        this.updateDisplay();
    }

    updateDisplay() {
        this.display.textContent = `Blocks: ${this.getBlockCount()}`;
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

        this.blocks.set(id, enrichedBlockData);
        this.updateDisplay();
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
        this.updateDisplay();
    }

    getBlock(id) {
        return this.blocks.get(id) || null;
    }

    getBlockCount() {
        return this.blocks.size;
    }

    listBlocks() {
        return Array.from(this.blocks.entries());
    }
}
