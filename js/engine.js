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
		this.world = new World();
		this.worldGroup = new THREE.Group();
		this.input = new Input(this);
		this.playerStartPosition = new THREE.Vector3(0, 100, 0);
		this.player = new Player(this.playerStartPosition);
		this.renderer = new Renderer(this);
	}

	async init() {
		// Set up the world
		await this.world.generateWorld();
	}

	start() {
		console.log('Starting engine...');
		this.clock = new THREE.Clock();
		this.gameLoop(0);
	}

	gameLoop(deltaTime) {
		// Update timing
		this.lastRenderTime = Date.now();

		this.update(deltaTime);
		this.renderer.render(deltaTime);
		this.framesRendered++;

		// Queue next frame
		requestAnimationFrame(() => this.gameLoop(deltaTime));
	}

	update(deltaTime) {
		this.input?.update(deltaTime);
		this.player?.update(deltaTime);
		this.world?.update(deltaTime);
		this.framerate?.update();
		this.frustum?.update(this.player.camera);
	}
}
