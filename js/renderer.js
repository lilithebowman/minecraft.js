import * as THREE from 'three';
import { TextureManager, DisplayList } from './modules.js';

export class Renderer {
    constructor() {
        // Initialize display list
        this.displayList = new Set();

        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        
        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Update camera position and rotation
        this.camera.position.set(0, 100, 100); // Move camera back and up
        this.camera.lookAt(0, 0, 0); // Look at center

        // Add fog to scene for depth
        this.scene.fog = new THREE.Fog(0x87ceeb, 0, 500);
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Initialize texture manager
        this.textureManager = new TextureManager();

        // Create block geometry once
        this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    }

    addBlock(x, y, z, type) {
        const block = new THREE.Mesh(
            this.blockGeometry,
            this.blockManager.getMaterial(type)
        );
        block.position.set(x, y, z);
        this.scene.add(block);
        return this.displayList.add(block);
    }

    removeBlock(id) {
        const block = this.displayList.get(id);
        if (block) {
            this.scene.remove(block);
            this.displayList.remove(id);
            return true;
        }
        return false;
    }

    clearDisplayList() {
        // Remove all objects from scene and clear the display list
        for (const object of this.displayList) {
            this.scene.remove(object);
        }
        this.displayList.clear();
    }

    setPlayer(player) {
        this.player = player;
    }

    getPlayerChunk() {
        if (!this.player) return null;
        return {
            x: Math.floor(this.player.position.x / 16),
            z: Math.floor(this.player.position.z / 16)
        };
    }

    isChunkInRange(blockX, blockZ, renderDistance = 2) {
        const playerChunk = this.getPlayerChunk();
        if (!playerChunk) return false;

        const blockChunkX = Math.floor(blockX / 16);
        const blockChunkZ = Math.floor(blockZ / 16);

        return Math.abs(blockChunkX - playerChunk.x) <= renderDistance &&
               Math.abs(blockChunkZ - playerChunk.z) <= renderDistance;
    }

    render() {
        // Clear the scene
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 100, 10);
        this.scene.add(ambientLight, directionalLight);

        // Add blocks from visible chunks
        const visibleChunks = this.world.getVisibleChunks(this.camera);
        for (const chunk of visibleChunks) {
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 256; y++) {
                    for (let z = 0; z < 16; z++) {
                        const blockType = chunk.getBlock(x, y, z);
                        if (blockType) {
                            const worldX = chunk.x * 16 + x;
                            const worldZ = chunk.z * 16 + z;
                            this.addBlock(worldX, y, worldZ, blockType);
                        }
                    }
                }
            }
        }

        // Add debug axes
        const axesHelper = new THREE.AxesHelper(50);
        this.scene.add(axesHelper);

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}
