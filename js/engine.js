import * as THREE from 'three';
import { Block, Framerate, Frustum, World, Input, Player } from './modules.js';
import { debug } from './debug.js';

export class Engine {
	constructor() {
		this.fpsLimit = 60;
		this.fpsInterval = 1000 / this.fpsLimit;
		this.lastRenderTime = 0;

		this.scene = new THREE.Scene();
		this.scene.fog = new THREE.Fog(0x87ceeb, 0, 500);
		this.scene.background = new THREE.Color(0x87ceeb);

		this.renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('gameCanvas'),
			antialias: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio / 2);

		window.addEventListener('resize', () => this.handleResize());

		// this.textureManager = new TextureManager();
		this.frustum = new Frustum();
		this.framerate = new Framerate();
		this.world = new World();
		this.worldGroup = new THREE.Group();
		this.input = new Input(this);
		this.player = new Player();
	}

	async init() {
		// Set up the world
		await this.world.generateWorld();

		this.renderer.setAnimationLoop(() => {
			const deltaTime = this.clock.getDelta();
			this.update(deltaTime);
			this.render(deltaTime);
		});
	}

	start() {
		this.clock = new THREE.Clock();
		this.init();
	}

	handleResize() {
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.player.camera.aspect = window.innerWidth / window.innerHeight;
	}

	render(deltaTime) {
		if (this.lastRenderTime + this.fpsInterval > Date.now()) return;

		this.lastRenderTime = Date.now();

		// Update the block count
		debug.updateStats({
			blocks: this.scene.children.length
		})

		this.renderer.render(this.scene, this.player.camera);
	}

	update(deltaTime) {
		this.player?.update(deltaTime);
		this.world?.update(deltaTime);
		this.framerate?.update();
		this.frustum?.update(this.player.camera);
	}
}