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

		// Use multiple chunk processors
		this.chunkProcessors = [];
		const processorCount = navigator.hardwareConcurrency || 4;
		
		for (let i = 0; i < processorCount; i++) {
			const worker = new Worker(
				new URL('./workers/chunkProcessor.js', import.meta.url),
				{ type: 'module' }
			);
			
			worker.onmessage = this.handleChunkProcessorMessage.bind(this);
			this.chunkProcessors.push(worker);
		}

		// Set block types
		this.blockTypes = ['grass', 'dirt', 'stone', 'bedrock'];

		// Pre-allocate buffers
		this.instanceBuffers = new Map();
		this.blockTypes.forEach(type => {
			this.instanceBuffers.set(type, {
				matrices: new Float32Array(this.INSTANCES_PER_TYPE * 16),
				count: 0
			});
		});

		// Add debug blocks
		this.addDebugBlocks(this.scene);
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
		if (this.lastRenderTime + this.fpsInterval > Date.now()) return;
		
		this.lastRenderTime = Date.now();

		// Add debug blocks
		this.addDebugBlocks(this.scene);

		// Get visible chunks
		const visibleChunks = this.world.getVisibleChunks(this.camera);
		if (visibleChunks.length === 0) return;

		// Distribute chunks among workers
		const chunksPerWorker = Math.ceil(visibleChunks.length / this.chunkProcessors.length);
		this.chunkProcessors.forEach((worker, index) => {
			const start = index * chunksPerWorker;
			const chunks = visibleChunks.slice(start, start + chunksPerWorker);
			
			worker.postMessage({
				chunks,
				frustum: this.frustum.toJSON()
			});
		});

		// Update camera and render
		if (this.camera) {
			this.camera.updatePosition();
			this.frustum.update(this.camera);
		}

		this.renderer.render(this.scene, this.camera.getCamera());
	}

	handleChunkProcessorMessage(e) {
		const { instanceData } = e.data;
		
		// Update instance meshes using the pre-allocated buffers
		for (const [type, data] of instanceData.entries()) {
			const mesh = this.instancedMeshes.get(type);
			if (mesh && data.count > 0) {
				mesh.count = data.count;
				mesh.instanceMatrix.array.set(data.positions);
				mesh.instanceMatrix.needsUpdate = true;
			}
		}
	}

	getInstanceData(visibleChunks) {
		const instanceData = new Map();
		const blockTypes = ['grass', 'dirt', 'stone', 'bedrock'];

		// Initialize data structure for each block type
		blockTypes.forEach(type => {
			instanceData.set(type, {
				count: 0,
				positions: []
			});
		});

		// Process each visible chunk
		for (const chunk of visibleChunks) {
			// Get blocks from chunk
			const blocks = chunk.getLocalBlocks(this.camera);
			
			// Process each block
			for (const block of blocks) {
				const data = instanceData.get(block.type);
				if (data && data.count < this.INSTANCES_PER_TYPE) {
					// Create transformation matrix
					const matrix = new THREE.Matrix4();
					matrix.setPosition(
						block.position.x,
						block.position.y,
						block.position.z
					);
					
					// Store matrix elements
					data.positions.push(Array.from(matrix.elements));
					data.count++;
				}
			}
		}

		debug.log(`Processing ${visibleChunks.length} chunks`);
		debug.log(`Total instances: ${Array.from(instanceData.values()).reduce((sum, data) => sum + data.count, 0)}`);

		return instanceData;
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

	createDebugGrid() {
        // Create a grid of points
        const gridSize = 32;
        const spacing = 1; // 1 meter spacing
        const points = [];
        
        // Generate grid points
        for (let x = -gridSize; x <= gridSize; x += spacing) {
            for (let z = -gridSize; z <= gridSize; z += spacing) {
                points.push(new THREE.Vector3(x, 0, z));
            }
        }

        // Create geometry and material
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.PointsMaterial({
            color: 0xffff00,
            size: 0.1,
            sizeAttenuation: true
        });

        // Create points mesh
        this.debugGrid = new THREE.Points(geometry, material);
        this.scene.add(this.debugGrid);
        
        debug.log(`Created debug grid with ${points.length} points`);
    }

    initialize(world, player) {
        try {
            // Initialize texture manager first
            this.textureManager.initialize();
            
            // Initialize skybox
            this.skybox.initialize();
            
            // Set world and player
            this.setWorld(world);
            this.setPlayer(player);
            
            // Create block manager reference
            this.block = world.block;
            
            // Add debug grid
            this.createDebugGrid();
            
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

		if (this.debugGrid) {
            this.scene.remove(this.debugGrid);
            this.debugGrid.geometry.dispose();
            this.debugGrid.material.dispose();
            this.debugGrid = null;
        }
	}

	addDebugBlocks(scene) {
		// Place blocks in a row 2 units in front of player spawn
		const blockTypes = ['grass', 'dirt', 'stone', 'bedrock'];
		const spacing = 2; // Space between blocks
		
		blockTypes.forEach((type, index) => {
			const matrix = new THREE.Matrix4();
			matrix.setPosition(
				0,           // x: centered
				1,           // y: one block up
				index * spacing + 2  // z: spaced out in front of player
			);
			
			const mesh = this.instancedMeshes.get(type);
			if (mesh) {
				mesh.count = 1;
				mesh.setMatrixAt(0, matrix);
				mesh.instanceMatrix.needsUpdate = true;
			}

			// Add debug blocks to scene
			blockTypes.forEach(type => {
				const mesh = this.instancedMeshes.get(type);
				if (mesh) {
					scene.add(mesh);
				}
			});
		});
	}
}
