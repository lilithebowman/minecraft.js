import * as THREE from 'three';
import { TextureManager, Camera } from './modules.js';
import { Frustum } from './utils/frustum.js';
import { Skybox } from './skybox.js';
import { debug } from './debug.js';

export class Renderer {
    constructor() {
        // Maximum number of chunks to render
        this.minChunks = 1;
        this.maxChunks = 4;

        // Limit FPS to 60
        this.fpsLimit = 60;
        this.fpsInterval = 1000 / this.fpsLimit;
        this.lastRenderTime = 0;

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
        // Create instanced mesh map
        this.instancedMeshes = new Map();
        this.INSTANCES_PER_TYPE = 5000;

        // Initialize frustum for visibility checks
        this.frustum = new Frustum();
        this.skybox = new Skybox(this.scene);

        // Create world group
        this.worldGroup = new THREE.Group();

        // Initialize instanced meshes
        this.initializeInstancedMeshes();

        // Initialize block instance worker
        this.blockWorker = new Worker(
            new URL('./workers/blockInstanceWorker.js', import.meta.url),
            { type: 'module' }
        );
        
        this.blockWorker.onmessage = (e) => {
            const { instanceData } = e.data;
            
            // Update instance matrices
            for (const [type, data] of instanceData) {
                const mesh = this.instancedMeshes.get(type);
                if (mesh) {
                    mesh.count = data.count;
                    for (let i = 0; i < data.count; i++) {
                        mesh.setMatrixAt(i, new THREE.Matrix4().fromArray(data.positions[i]));
                    }
                    mesh.instanceMatrix.needsUpdate = true;
                }
            }
        };
    }

    initializeInstancedMeshes() {
        const blockTypes = ['grass', 'dirt', 'stone', 'bedrock'];
        
        for (const type of blockTypes) {
            const geometry = this.blockGeometry;
            const material = this.textureManager.getMaterial(type);
            const instancedMesh = new THREE.InstancedMesh(
                geometry,
                material,
                this.INSTANCES_PER_TYPE
            );
            instancedMesh.count = 0; // Start with 0 instances
            this.instancedMeshes.set(type, instancedMesh);
            this.worldGroup.add(instancedMesh);
        }
    }

    // Handle window resizing
    handleResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.handleResize();
    }

    // Render the scene
    render(deltaTime) {
        // Update debug axes with current camera
        if (this.player) debug.updateAxes(this.player?.camera.camera);

        // Check if last render time is less than fps interval
        if (this.lastRenderTime && (deltaTime - this.lastRenderTime) < this.fpsInterval) {
            return; // Skip rendering to maintain FPS limit
        }
        this.lastRenderTime = deltaTime;
        
        // Check if world is set
        if (!this.world) {
            console.warn('Cannot render: world not set');
            return;
        }

        // Update skybox with camera reference
        this.skybox.update(this.scene, this.camera.camera);

        // Update camera position before rendering
        this.camera.updatePosition();

        // Update frustum with current camera
        this.frustum.update(this.camera.getCamera());

        // Clear the world group but keep instanced meshes
        const instancedMeshes = new Map(this.instancedMeshes);
        while (this.worldGroup.children.length > 0) {
            this.worldGroup.remove(this.worldGroup.children[0]);
        }
        this.instancedMeshes = instancedMeshes;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 100, 10);
        this.worldGroup.add(ambientLight, directionalLight);

        // Re-add instanced meshes to world group
        for (const mesh of this.instancedMeshes.values()) {
            this.worldGroup.add(mesh);
        }

        if (!this.player || !this.player.camera) {
            console.warn('Cannot render: player not set');
            return;
        }

        // Get visible chunks within player's view
        const allChunks = this.world.getVisibleChunks(this.player.camera);
        debug.log(`Total chunks: ${allChunks.length}`);
        
        const visibleChunks = allChunks.filter(chunk => this.frustum.isChunkVisible(chunk));
        debug.log(`Visible chunks after frustum culling: ${visibleChunks.length}`);

        // If no chunks are visible, warn the user
        if (visibleChunks.length < this.minChunks) {
            console.warn('No visible chunks to render');
            debug.log('Camera position:', this.player.camera.position);
            debug.log('Player position:', this.player.position);
        }

        // Process visible blocks directly
        for (const chunk of visibleChunks) {
            const blocks = chunk.getLocalBlocks(this.player.camera);
            for (const block of blocks) {
                const mesh = this.instancedMeshes.get(block.type);
                if (mesh && mesh.count < this.INSTANCES_PER_TYPE) {
                    const matrix = new THREE.Matrix4();
                    matrix.setPosition(block.position.x, block.position.y, block.position.z);
                    mesh.setMatrixAt(mesh.count++, matrix);
                    mesh.instanceMatrix.needsUpdate = true;
                }
            }
        }

        // Add world group to scene if not already added
        if (!this.scene.children.includes(this.worldGroup)) {
            this.scene.add(this.worldGroup);
        }

        // Render the scene with camera
        this.renderer.render(this.scene, this.camera.getCamera());
    }

    setWorld(world) {
        this.world = world;
        this.world.position = {
            x: 0,
            y: 0,
            z: 0
        };
        this.world.rotation = {
            x: 0,
            y: 0,
            z: 0
        };

        this.worldGroup.rotation.set(world.rotation.x, world.rotation.y, world.rotation.z);
        this.worldGroup.position.set(world.position.x, world.position.y, world.position.z);
        this.scene.add(this.worldGroup);
    }

    setPlayer(player) {
        this.player = player;
        this.camera = player.camera;
        this.camera.attachToPlayer(player);
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

    dispose() {
        // Dispose resources
        if (this.blockWorker) {
            this.blockWorker.terminate();
        }
    }
}
