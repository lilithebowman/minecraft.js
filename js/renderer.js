import * as THREE from 'three';
import { Block, Framerate, SceneDefaults } from './modules.js';
import { debug } from './debug.js';

export class Renderer {
	constructor(engine) {
		this.engine = engine;
		this.isAnimating = false;

		// Initialize scene defaults
		this.sceneDefaults = new SceneDefaults(this.engine?.player);
		this.renderer = this.sceneDefaults.getRenderer();
		this.scene = new THREE.Scene();

		// Add basic lighting
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		this.scene.add(ambientLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
		dirLight.position.set(100, 100, 50);
		this.scene.add(dirLight);

		this.worldGroup = new THREE.Group();
		this.scene.add(this.worldGroup);

		// Set up framerate
		this.framerate = new Framerate();
		this.block = new Block();

		// Create debug orientation cube
		this.createDebugCube();
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

	createDebugCube() {
		// Create a small cube
		const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
		const material = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			wireframe: true
		});
		this.debugCube = new THREE.Mesh(geometry, material);

		// Position in bottom-right corner
		this.debugCube.position.set(2, 2, -5);

		// Add to scene
		this.scene.add(this.debugCube);
	}

	animate() {
		// Stop animation if flag is false
		if (!this.isAnimating) {
			return;
		}

		// Update framerate
		this.framerate.update();

		try {
			// Ensure we have required components
			if (!this.world || !this.player?.camera) {
				console.warn('Missing required components for rendering');
				return;
			}

			// Update world state
			this.updateWorld();

			if (this.debugCube && this.engine?.player?.camera) {
				// Update debug cube rotation to match worldGroup
				this.debugCube.rotation.x = this.worldGroup.rotation.x;
				this.debugCube.rotation.y = this.worldGroup.rotation.y;
				this.debugCube.rotation.z = this.worldGroup.rotation.z;
				// Update debug cube position to match worldGroup
				this.debugCube.position.copy(this.worldGroup.position);
			}

			// Add blocks from chunks to the scene
			if (this.framerate?.frames > 60) {
				this.updateDirtyBlocks(this.worldGroup, this.world.chunks);
			}

			// Update debug stats with objects in scene
			debug.updateStats({
				blocks: this.scene?.children?.length || 0
			});

			// Render scene
			this.renderer.render(this.scene, this.engine.player.camera);

			// Request next frame
			requestAnimationFrame(() => this.animate());

		} catch (error) {
			console.error('Render loop error:', error);
			this.isAnimating = false;
		}
	}

	updateDirtyBlocks(worldGroup, chunks) {
		if (!chunks || !worldGroup) throw new Error('Invalid chunks or worldGroup');

		// Don't show loading display every frame
		if (chunks.size > 0 && Array.from(chunks.values()).some(chunk => chunk.isDirty)) {
			this.world.createChunkLoadingDisplay();
		}

		// Add blocks from each chunk to the world group
		if (chunks.size === 0) {
			console.warn('No chunks available to render');
			this.world.removeChunkLoadingDisplay();
			return;
		}

		let chunksProcessed = 0;
		const dirtyChunks = Array.from(chunks.values()).filter(chunk => chunk.isDirty);

		debug.log(`Processing ${dirtyChunks.length} dirty chunks`);

		// Process each dirty chunk
		for (const chunk of dirtyChunks) {
			// Rebuild chunk mesh if it's dirty
			debug.log(`Rebuilding mesh for chunk ${chunk.x},${chunk.z}`);
			chunk.rebuildMesh();

			// Add the chunk mesh to the world group if it exists
			if (chunk.mesh) {
				if (!worldGroup.children.includes(chunk.mesh)) {
					debug.log(`Adding chunk mesh ${chunk.x},${chunk.z} to scene`);
					worldGroup.add(chunk.mesh);
				}
				chunksProcessed++;
			} else {
				console.warn(`Chunk ${chunk.x},${chunk.z} has no mesh after rebuild`);
			}

			// Limit the number of chunks processed per frame for performance
			if (chunksProcessed > 5) {
				break;
			}
		}

		if (chunksProcessed > 0) {
			console.log(`Processed ${chunksProcessed} chunks`);
		}

		console.log(`worldGroup has ${this.worldGroup.children.length} children`);

		this.world.removeChunkLoadingDisplay();
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
