import * as THREE from 'three';
import { BlockMeshRenderer, Chunk, Framerate, Frustum, SceneDefaults, TextureManager } from './modules.js';
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
		this.worldGroup = engine.worldGroup || new THREE.Group();

		// Initialize block mesh renderer
		this.blockMeshRenderer = new BlockMeshRenderer(this.textureManager);
	}

	// Handle window resizing
	handleResize() {
		if (this.threeRenderer) {
			this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
			this.player.camera.aspect = window.innerWidth / window.innerHeight;
		}
	}

	// Render the scene
	render(deltaTime) {
		if (!this.engine || !this.engine.player) {
			console.error('Engine or player is not defined in render');
			debugger;
		}

		// Update framerate stats
		this.framerate.update();

		// Update worldGroup with visible chunks
		this.worldGroup.children = [];
		for (let chunk of this.world.chunks) {
			if (!chunk?.blocks) {
				chunk = new Chunk(this.player.position.x, this.player.position.z);
			}
			for (let block of chunk.getBlocks()) {
				const blockMesh = this.blockMeshRenderer.getBlockMesh(block);
				if (blockMesh) {
					this.worldGroup.add(blockMesh);
				}
			}
		}

		// Add worldGroup to the scene
		for (let mesh of this.worldGroup.children) {
			this.scene.add(mesh);
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
}
