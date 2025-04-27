import * as THREE from 'three';
import { TextureManager } from './modules.js';
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
		this.player.camera.handleResize();
	}

	// Render the scene
	render(deltaTime) {
		if (!this.player || !this.world) {
			console.warn('Player or world not set, skipping render');
			return;
		}

		// Check if enough time has passed since the last render
		if (this.lastRenderTime + this.fpsInterval > Date.now()) return;

		this.lastRenderTime = Date.now();

		// Get visible chunks
		const visibleChunks = this.world.getVisibleChunks(this.player);
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
		this.blockMeshRenderer.updateMeshes(visibleChunks, this.player.camera, this.frustum);

		// Update frustum
		this.frustum.update(this.player.camera);

		// Render the scene
		this.renderer.render(this.scene, this.player.camera);
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
		this.player.camera = player.getCamera(); // Use the player's THREE.PerspectiveCamera
	}

	createCrosshair() {
		// Create a small black cube in the center of the view
		const centerCubeGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
		const centerCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
		this.centerCube = new THREE.Mesh(centerCubeGeometry, centerCubeMaterial);

		// Add it to the camera, not the scene, so it moves with the camera
		this.player.camera.add(this.centerCube);

		// Position it slightly in front of the camera
		this.centerCube.position.set(0, 0, -0.5);
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

			// Add crosshair/targeting cube
			this.createCrosshair();

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

		if (this.centerCube) {
			this.player.camera.getCamera().remove(this.centerCube);
			this.centerCube.geometry.dispose();
			this.centerCube.material.dispose();
			this.centerCube = null;
		}
	}

	addDebugBlocks(scene) {
		// Use the BlockMeshRenderer to add debug blocks
		this.blockMeshRenderer.addDebugBlocks(scene);
	}
}
