import * as THREE from 'three';
import { BlockMeshRenderer, Framerate, Frustum, SceneDefaults, TextureManager } from './modules.js';
import { debug } from './debug.js';

export class Renderer {
	constructor(engine) {
		// Maximum number of chunks to render
		this.minChunks = 1;
		this.maxChunks = 4;

		// Limit FPS to 60
		this.fpsLimit = 60;
		this.fpsInterval = 1000 / this.fpsLimit;
		this.lastRenderTime = 0;

		// Initialize the engine
		this.engine = engine;
		this.player = this.engine?.player;
		this.world = this.engine?.world;

		// Create the scene
		this.scene = new THREE.Scene();
		this.sceneDefaults = new SceneDefaults(this.engine?.player)
		while (!this.sceneDefaults) {
			this.scene = this.sceneDefaults.getScene();
			this.scene.children = [];
			this.sceneDefaults.setupScene();
			this.threeRenderer = this.sceneDefaults.getRenderer();
		}

		// Handle window resizing
		window.addEventListener('resize', () => this.handleResize());

		// Initialize texture manager
		this.textureManager = new TextureManager();

		// Initialize frustum for visibility checks
		this.frustum = new Frustum();

		// Initialize framerate stats
		this.framerate = new Framerate();

		// Create world group
		this.worldGroup = new THREE.Group();

		// Initialize block mesh renderer
		this.blockMeshRenderer = new BlockMeshRenderer(['grass', 'dirt', 'stone', 'bedrock']);
	}

	// Handle window resizing
	handleResize() {
		this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
		this.player.camera.aspect = window.innerWidth / window.innerHeight;
	}

	// Render the scene
	render(deltaTime) {
		if (!this.engine || !this.engine.player) {
			console.error('Engine or player is not defined in render');
			debugger;
		}

		// console.log('Rendering...');
		this.scene.add(this.worldGroup);

		// Update framerate stats
		this.framerate.update();

		// Update debug stats with scene object count
		const objectsInScene = this.scene.children.length;
		debug.updateStats({ blocks: objectsInScene });
		if (!objectsInScene) {
			this.dumpScene();
			debugger;
		}

		// Render the scene
		this.threeRenderer = this.sceneDefaults.getRenderer();
		this.threeRenderer.render(this.scene, this.player.camera);
		return true;
	}

	dumpScene() {
		console.log(this.scene);
		console.log(this.worldGroup);
		console.log(this.player);
		console.log(this.world.chunks);
	}

	// Add this new method to handle chunk meshes
	addChunksToScene(chunks) {
		// First, keep track of chunks already in the scene
		if (!this.chunksInScene) {
			this.chunksInScene = new Set();
		}

		// Add any chunks that aren't already in the scene
		for (const chunk of chunks) {
			const chunkId = `${chunk.x},${chunk.z}`;

			if (!this.chunksInScene.has(chunkId) && chunk.mesh) {
				this.worldGroup.add(chunk.mesh);
				this.chunksInScene.add(chunkId);
			}
		}
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

	async initialize(world, player) {
		try {
			// Initialize texture manager first
			await this.textureManager.initialize();

			// Set world and player
			this.setWorld(world);
			this.setPlayer(player);

			// Create block manager reference
			this.block = world.block;

			// Initialize block mesh renderer and add to world group
			const blockMeshes = this.blockMeshRenderer.createInstancedMeshes(this.textureManager);
			this.worldGroup.add(blockMeshes);

			console.log('Renderer initialized successfully');
			return this;
		} catch (error) {
			console.error('Failed to initialize renderer:', error);
			throw error;
		}
	}

	dispose() {
		// Dispose resources
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
}
