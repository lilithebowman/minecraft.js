import * as THREE from 'three';
import { Framerate, Frustum, World, Input, Player, Renderer } from './modules.js';
import { debug } from './debug.js';

export class Engine {
	constructor() {
		this.fpsLimit = 60;
		this.fpsInterval = 1000 / this.fpsLimit;
		this.framesRendered = 0;
		this.lastRenderTime = 0;
		this.failedSceneError = false;

		this.frustum = new Frustum();
		this.framerate = new Framerate();
		this.worldGroup = new THREE.Group();
		this.world = new World(this.worldGroup);
		this.input = new Input(this);
		this.playerStartPosition = new THREE.Vector3(0, 100, 0);
		this.player = new Player(this.playerStartPosition);
		this.renderer = new Renderer(this);
	}

	async init() {
		console.log('Initializing engine...');

		try {
			// Initialize components in order
			await this.blockManager.initialize();
			console.log('Block manager initialized');

			// Initialize player first (creates camera)
			await this.player.initialize();
			console.log('Player initialized');

			// Initialize world after player
			await this.world.generateWorld();
			console.log('World generated');

			// Initialize renderer last
			await this.renderer.initialize(this.world, this.player);
			console.log('Renderer initialized');

			// Set initial player position
			this.player.position.y = 100;
			this.player.updateCameraPosition();

			console.log('Engine initialization complete');
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
}
