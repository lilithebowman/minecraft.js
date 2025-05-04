import * as THREE from 'three';
import { BlockMeshRenderer, SceneDefaults } from './modules.js';

export class Renderer {
	constructor(engine) {
		this.engine = engine;
		this.sceneDefaults = new SceneDefaults();
		this.renderer = this.sceneDefaults.getRenderer();
		this.scene = new THREE.Scene();
		this.worldGroup = new THREE.Group();
		this.scene.add(this.worldGroup);

		// Initialize block renderer
		this.blockMeshRenderer = new BlockMeshRenderer();

		// Start render loop
		this.animate();
	}

	animate() {
		requestAnimationFrame(() => this.animate());

		if (!this.engine?.player?.camera) {
			console.warn('Waiting for camera...');
			return;
		}

		// Update world
		this.updateWorld();

		// Render scene
		this.renderer.render(this.scene, this.engine.player.camera);
	}

	updateWorld() {
		if (!this.engine?.world || !this.engine?.player) return;

		// Get visible chunks
		const visibleChunks = this.engine.world.getVisibleChunks(this.engine.player);

		// Update block meshes
		this.blockMeshRenderer.updateMeshes(
			visibleChunks,
			this.engine.player.camera,
			this.engine.frustum
		);
	}
}
