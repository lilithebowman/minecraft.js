import * as THREE from 'three';
import { BlockMeshRenderer, SceneDefaults } from './modules.js';

export class Renderer {
	constructor(engine) {
		this.engine = engine;
		this.isAnimating = false;

		// Initialize scene defaults
		this.sceneDefaults = new SceneDefaults(this.engine?.player);
		this.renderer = this.sceneDefaults.getRenderer();
		this.scene = new THREE.Scene();
		this.worldGroup = new THREE.Group();
		this.scene.add(this.worldGroup);
	}

	async initialize(world, player) {
		if (!world || !player) {
			throw new Error('World and Player required for renderer initialization');
		}

		this.world = world;
		this.player = player;

		// Start animation only if not already running
		if (!this.isAnimating) {
			this.isAnimating = true;
			this.animate();
		}
	}

	animate() {
		// Stop animation if flag is false
		if (!this.isAnimating) {
			return;
		}

		try {
			// Ensure we have required components
			if (!this.world || !this.player?.camera) {
				console.warn('Missing required components for rendering');
				return;
			}

			// Update world state
			this.updateWorld();

			// Render scene
			this.renderer.render(this.scene, this.player.camera);

			// Request next frame
			requestAnimationFrame(() => this.animate());

		} catch (error) {
			console.error('Render loop error:', error);
			this.isAnimating = false;
		}
	}

	updateWorld() {
		if (!this.world || !this.player) return;

		// Get visible chunks with null checks
		const visibleChunks = this.world.getVisibleChunks(
			this.player,
			this.engine?.frustum
		);

		// Update meshes if we have chunks
		if (visibleChunks?.length) {
			this.blockMeshRenderer?.updateMeshes(
				visibleChunks,
				this.player.camera
			);
		}
	}

	dispose() {
		this.isAnimating = false;

		try {
			// Dispose of all scene objects recursively
			if (this.scene) {
				this.scene.traverse((object) => {
					// Dispose geometries
					if (object.geometry) {
						object.geometry.dispose();
					}

					// Dispose materials
					if (object.material) {
						if (Array.isArray(object.material)) {
							object.material.forEach(material => material.dispose());
						} else {
							object.material.dispose();
						}
					}
				});

				// Clear scene
				while (this.scene.children.length > 0) {
					this.scene.remove(this.scene.children[0]);
				}
			}

			// Dispose renderer
			if (this.renderer) {
				this.renderer.dispose();
				this.renderer.forceContextLoss();
				this.renderer.domElement?.remove();
			}

			// Clear references
			this.scene = null;
			this.renderer = null;
			this.worldGroup = null;
			this.blockMeshRenderer = null;

			console.log('Renderer disposed successfully');
		} catch (error) {
			console.error('Error disposing renderer:', error);
		}
	}
}
