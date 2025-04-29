import * as THREE from 'three';
import { TextureManager } from './modules.js';
import { Frustum } from './utils/frustum.js';
import { BlockMeshRenderer } from './BlockMeshRenderer.js';
import { Framerate } from './framerate.js';

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

		// Add fog to scene for depth
		this.scene.fog = new THREE.Fog(0x87ceeb, 0, 500);
		this.scene.background = new THREE.Color(0x87ceeb);

		this.renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('gameCanvas'),
			antialias: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio / 2);

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
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.player.camera.aspect = window.innerWidth / window.innerHeight;
	}

	// Render the scene
	render(deltaTime) {
		// Check if enough time has passed since the last render
		if (this.lastRenderTime + this.fpsInterval > Date.now()) return;

		this.lastRenderTime = Date.now();

		// Get visible chunks
		const visibleChunks = this.world.getVisibleChunks(this.player);
		if (visibleChunks.length === 0) {
			return;
		}

		// Update block meshes
		this.blockMeshRenderer.updateMeshes(visibleChunks, this.player.camera, this.frustum);

		// Make sure chunk meshes are in the scene
		this.addChunksToScene(visibleChunks);

		// Render world group
		this.worldGroup.rotation.set(
			this.world.rotation.x,
			this.world.rotation.y,
			this.world.rotation.z
		);

		// Render the world group
		for (const block of this.worldGroup.children) {
			if (block instanceof THREE.Mesh) {
				block.visible = this.frustum.contains(block.position);
				if (block.visible) {
					block.material.map = this.textureManager.getTexture(block.type);
					this.scene.add(block);
				}
			}
		}
		this.scene.add(this.worldGroup);

		// Update frustum
		this.frustum.update(this.player.camera);

		// Update framerate stats
		this.framerate.update();

		// Render the scene
		this.renderer.render(this.scene, this.player.camera);
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
		return;
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
