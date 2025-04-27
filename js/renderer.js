import * as THREE from 'three';
import { TextureManager, Camera } from './modules.js';
import { Frustum } from './utils/frustum.js';
import { Skybox } from './skybox.js';
import { debug } from './debug.js';
import { BlockMeshRenderer } from './BlockMeshRenderer.js';

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

		// Initialize frustum for visibility checks
		this.frustum = new Frustum();
		this.skybox = new Skybox(this.scene);

		// Create world group
		this.worldGroup = new THREE.Group();

		// Initialize block mesh renderer
		this.blockMeshRenderer = new BlockMeshRenderer(['grass', 'dirt', 'stone', 'bedrock']);

		// Use multiple chunk processors
		this.chunkProcessors = [];
		const processorCount = navigator.hardwareConcurrency || 4;

		for (let i = 0; i < processorCount; i++) {
			const worker = new Worker(
				new URL('./workers/chunkProcessor.js', import.meta.url),
				{ type: 'module' }
			);

			worker.onmessage = (e) => this.blockMeshRenderer.handleChunkProcessorMessage(e);
			this.chunkProcessors.push(worker);
		}

		// Add debug blocks
		this.addDebugBlocks(this.scene);
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

		// render skybox mesh
		this.skybox.update(this.scene);

		// Update debug grid
		if (this.debugGrid) {
			this.debugGrid.rotation.y += 0.01; // Rotate grid for better visibility
		}

		// Update block meshes
		this.blockMeshRenderer.updateMeshes(visibleChunks, this.camera, this.frustum);

		// Update camera and render
		if (this.camera) {
			this.camera.updatePosition();
			this.frustum.update(this.camera);
		}

		// add a black cube to the center of the view
		const centerCubeGeometry = new THREE.BoxGeometry(1, 1, 1);
		const centerCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
		const centerCube = new THREE.Mesh(centerCubeGeometry, centerCubeMaterial);
		centerCube.position.set(0, 0, -5); // Position it in front of the camera
		this.scene.add(centerCube);

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
			this.block = world.block;

			// Initialize block mesh renderer and add to world group
			const blockMeshes = this.blockMeshRenderer.createInstancedMeshes(this.textureManager);
			this.worldGroup.add(blockMeshes);

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
		if (this.chunkProcessors) {
			this.chunkProcessors.forEach(worker => worker.terminate());
			this.chunkProcessors = [];
		}

		if (this.blockMeshRenderer) {
			this.blockMeshRenderer.dispose();
		}

		if (this.debugGrid) {
			this.scene.remove(this.debugGrid);
			this.debugGrid.geometry.dispose();
			this.debugGrid.material.dispose();
			this.debugGrid = null;
		}
	}

	addDebugBlocks(scene) {
		// Use the BlockMeshRenderer to add debug blocks
		this.blockMeshRenderer.addDebugBlocks(scene);
	}
}
