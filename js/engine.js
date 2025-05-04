import * as THREE from 'three';
import { Framerate, Frustum, World, Input, Player, Renderer, BlockManager } from './modules.js';
import { debug } from './debug.js';

export class Engine {
	constructor() {
		// Initialize block manager first
		this.blockManager = new BlockManager();

		// Initialize core components
		this.frustum = new Frustum();
		this.framerate = new Framerate();
		this.worldGroup = new THREE.Group();

		// Create player first but DON'T create camera yet
		this.playerStartPosition = new THREE.Vector3(0, 100, 0);
		this.player = new Player(this.playerStartPosition);

		// Create other components after player
		this.world = new World(this.worldGroup, this.blockManager);
		this.renderer = new Renderer(this);
		this.input = new Input(this);

		// Game state
		this.isRunning = false;
		this.lastTime = 0;
		this.fpsLimit = 60;
		this.fpsInterval = 1000 / this.fpsLimit;
	}

	async init() {
		console.log('Initializing engine...');

		try {
			// Initialize block manager first
			await this.blockManager.initialize();
			console.log('Block manager initialized');

			// Initialize player and camera
			await this.player.initialize();
			if (!this.player?.getCamera()) {
				throw new Error('Camera initialization failed');
			}

			// Force camera matrix updates
			this.player.camera.updateProjectionMatrix();
			this.player.camera.updateMatrixWorld();
			console.log('Player and camera initialized');

			// Initialize remaining components
			await this.world.generateWorld();
			console.log('World generated');

			await this.renderer.initialize(this.world, this.player);
			console.log('Renderer initialized');

			// Start game loop only after everything is ready
			this.start();
			console.log('Engine initialized successfully');

			return true;
		} catch (error) {
			console.error('Failed to initialize engine:', error);
			throw error;
		}
	}

	start() {
		this.isRunning = true;
		this.lastTime = performance.now();
		this.gameLoop();
	}

	gameLoop() {
		if (!this.isRunning) return;

		const currentTime = performance.now();
		const deltaTime = (currentTime - this.lastTime) / 1000;
		this.lastTime = currentTime;

		this.update(deltaTime);

		requestAnimationFrame(() => this.gameLoop());
	}

	update(deltaTime) {
		this.input?.update(deltaTime);
		this.player?.update(deltaTime);
		this.world?.update(deltaTime);
		this.framerate?.update();
		this.frustum?.update(this.player.camera);
	}

	dispose() {
		console.log('Disposing engine resources...');

		// Stop the game loop
		this.isRunning = false;

		try {
			// Dispose components in reverse initialization order
			this.renderer?.dispose();
			this.world?.dispose();
			this.player?.dispose();
			this.input?.destroy();
			this.blockManager?.dispose();
			this.frustum = null;

			// Clear references
			this.worldGroup = null;
			this.player = null;
			this.world = null;
			this.renderer = null;
			this.input = null;
			this.blockManager = null;

			console.log('Engine disposed successfully');
		} catch (error) {
			console.error('Error during engine disposal:', error);
		}
	}
}
