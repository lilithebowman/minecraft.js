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

		this.scene = new THREE.Scene();
		this.scene.fog = new THREE.Fog(0x87ceeb, 0, 500);
		this.scene.background = new THREE.Color(0x87ceeb);

		this.renderer = new Renderer(this);
		this.renderer.threeRenderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.threeRenderer.setPixelRatio(window.devicePixelRatio / 2);

		window.addEventListener('resize', () => this.handleResize());
	}

	async init() {
		// Set up the world
		await this.world.generateWorld();
	}

	start() {
		console.log('Starting engine...');
		this.clock = new THREE.Clock();
		this.render(0);
	}

	handleResize() {
		this.renderer.threeRenderer.setSize(window.innerWidth, window.innerHeight);
		this.player.camera.aspect = window.innerWidth / window.innerHeight;
	}

	render(deltaTime) {
		// Update timing
		this.lastRenderTime = Date.now();

		this.renderer.render(deltaTime);
		this.framesRendered++;

		// Queue next frame
		requestAnimationFrame(() => this.render(deltaTime));
	}

	update(deltaTime) {
		this.player?.update(deltaTime);
		this.world?.update(deltaTime);
		this.framerate?.update();
		this.frustum?.update(this.player.camera);
	}
}