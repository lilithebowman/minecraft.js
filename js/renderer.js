import * as THREE from 'three';
import { TextureManager, DisplayList, Camera } from './modules.js';
import { Frustum } from './utils/frustum.js';
import { Skybox } from './skybox.js';

export class Renderer {
    constructor() {
        // Initialize display list
        this.displayList = new Set();

        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        
        // Add fog to scene for depth
        this.scene.fog = new THREE.Fog(0x87ceeb, 0, 500);
        this.scene.background = new THREE.Color(0x87ceeb);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Handle window resizing
        window.addEventListener('resize', () => this.handleResize());

        // Initialize texture manager
        this.textureManager = new TextureManager();

        // Create block geometry once
        this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);

        // Initialize frustum
        this.frustum = new Frustum();

        // Create camera first
        this.camera = new Camera();
        
        // Create world rotation group
        this.worldGroup = new THREE.Group();
        this.scene.add(this.worldGroup);

        this.world = null;
        this.player = null;
		this.engine = null;

        // Initialize skybox last
        this.skybox = new Skybox();
        if (this.skybox.mesh) {
            this.scene.add(this.skybox.mesh);
        }
    }

    setWorld(world) {
        if (!world) {
            console.error('Attempted to set null world in renderer');
            return;
        }
        this.world = world;
    }

    setPlayer(player) {
        if (!player) {
            console.error('Attempted to set null player in renderer');
            return;
        }
        this.player = player;
        this.camera.attachToPlayer(player);
    }

    addBlock(x, y, z, type) {
        const block = new THREE.Mesh(
            this.blockGeometry,
            this.blockManager.getMaterial(type)
        );
        block.position.set(x, y, z);
        this.worldGroup.add(block);
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
        for (const object of this.displayList) {
            this.worldGroup.remove(object);
        }
        this.displayList.clear();
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

    handleResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

	init(engine) {
		this.engine = engine;
		this.engine.getEventEmitter().on('render', (deltaTime) => {
			this.render(deltaTime);
		});
		this.engine.getEventEmitter().on('reset', () => {
			this.clearDisplayList();
		});
	}

    render(deltaTime) {
        if (!this.world) {
            console.warn('Cannot render: world not set');
            return;
        }

        // Update skybox first
        this.skybox.update(deltaTime);
        
        // Make skybox follow camera position
        if (this.camera) {
            const campos = this.camera.getCamera().position;
            this.skybox.mesh.position.copy(campos);
        }

        // Update camera position before rendering
        this.camera.updatePosition();

        // Update frustum with current camera
        this.frustum.update(this.camera.getCamera());

        // Clear the world group
        while (this.worldGroup.children.length > 0) {
            this.worldGroup.remove(this.worldGroup.children[0]);
        }

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 100, 10);
        this.worldGroup.add(ambientLight, directionalLight);

        // Add blocks from visible chunks
        const visibleChunks = this.world.getVisibleChunks(this.camera);
        for (const chunk of visibleChunks) {
            if (this.frustum.isChunkVisible(chunk)) {
                for (let x = 0; x < 16; x++) {
                    for (let y = 0; y < 256; y++) {
                        for (let z = 0; z < 16; z++) {
                            const blockType = chunk.getBlock(x, y, z);
                            if (blockType) {
                                const worldX = chunk.x * 16 + x;
                                const worldZ = chunk.z * 16 + z;
                                const block = new THREE.Mesh(
                                    this.blockGeometry,
                                    this.blockManager.getMaterial(blockType)
                                );
                                block.position.set(worldX, y, worldZ);
                                this.worldGroup.add(block);
                            }
                        }
                    }
                }
            }
        }

        // Add debug axes
        const axesHelper = new THREE.AxesHelper(50);
        this.worldGroup.add(axesHelper);

        // Update world group rotation based on player rotation
        if (this.player) {
            this.worldGroup.rotation.y = -this.player.rotation;
        }

        // Render the scene with camera
        this.renderer.render(this.scene, this.camera.getCamera());
    }

    async initialize(world, player) {
        try {
            // Initialize texture manager first
            await this.textureManager.initialize();
            
            // Initialize skybox
            await this.skybox.initialize();
            
            // Set world and player
            this.setWorld(world);
            this.setPlayer(player);
            
            // Create block manager reference
            this.blockManager = world.blockManager;
            
            console.log('Renderer initialized successfully');
            return this;
        } catch (error) {
            console.error('Failed to initialize renderer:', error);
            throw error;
        }
    }
}
