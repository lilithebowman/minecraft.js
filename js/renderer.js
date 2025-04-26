import * as THREE from 'three';
import { TextureManager, Camera } from './modules.js';
import { Frustum } from './utils/frustum.js';
import { Skybox } from './skybox.js';
import { debug } from './debug.js';

export class Renderer {
	constructor() {
		// Maximum number of chunks to render
		this.maxChunks = 4;

		// Limit FPS to 60
		this.fpsLimit = 60;
		this.fpsInterval = 1000 / this.fpsLimit;
		this.lastRenderTime = 0;

		// Create the scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
		
		// Add fog to scene for depth
		this.scene.fog = new THREE.Fog(0x87ceeb, 0, 500);
		this.scene.background = new THREE.Color(0x87ceeb);

		this.renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('gameCanvas'),
			antialias: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		// Handle window resizing
		window.addEventListener('resize', () => this.handleResize());

		// Initialize texture manager
		this.textureManager = new TextureManager();

		// Create block geometry once
		this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);
		// Create instanced mesh map
		this.instancedMeshes = new Map();
		this.INSTANCES_PER_TYPE = 5000;

		// Initialize frustum for visibility checks
		this.frustum = new Frustum();
		this.skybox = new Skybox(this.scene);

		// Create world group
		this.worldGroup = new THREE.Group();

		// Initialize instanced meshes
		this.initializeInstancedMeshes();
	}

	initializeInstancedMeshes() {
		const blockTypes = ['grass', 'dirt', 'stone', 'bedrock'];
		
		for (const type of blockTypes) {
			const geometry = this.blockGeometry;
			const material = this.textureManager.getMaterial(type);
			const instancedMesh = new THREE.InstancedMesh(
				geometry,
				material,
				this.INSTANCES_PER_TYPE
			);
			instancedMesh.count = 0; // Start with 0 instances
			this.instancedMeshes.set(type, instancedMesh);
			this.worldGroup.add(instancedMesh);
		}
	}

	// Handle window resizing
	handleResize() {
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.camera.handleResize();
	}

	// Render the scene
	render(deltaTime) {
		// Update debug axes with current camera
		debug.updateAxes(this.camera.camera);

		// Check if last render time is less than fps interval
		if (this.lastRenderTime && (deltaTime - this.lastRenderTime) < this.fpsInterval) {
			return; // Skip rendering to maintain FPS limit
		}
		this.lastRenderTime = deltaTime;
		
		// Check if world is set
		if (!this.world) {
			console.warn('Cannot render: world not set');
			return;
		}

		// Update skybox first
		this.skybox.update(deltaTime);
		
		// Make skybox follow camera position
		if (this.camera) {
			const campos = this.camera.getCamera().position;
			this.skybox.mesh.position.copy(campos);
		}

		// Update camera position before rendering
		this.camera.updatePosition();

		// Update frustum with current camera
		this.frustum.update(this.camera.getCamera());

		// Clear the world group
		while (this.worldGroup.children.length > 0) {
			this.worldGroup.remove(this.worldGroup.children[0]);
		}

		// Add lighting
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(10, 100, 10);
		this.worldGroup.add(ambientLight, directionalLight);

		// Reset instance counts
		for (const mesh of this.instancedMeshes.values()) {
			mesh.count = 0;
		}

		const matrix = new THREE.Matrix4();
		
		if(!this.player || !this.player.camera) {
			console.warn('Cannot render: player not set');
			return;
		}
		const visibleChunks = this.world.getVisibleChunks(this.player.camera);
		
		// Iterate through visible chunks and set instance matrices
		for (const chunk of visibleChunks) {
			if (this.frustum.isChunkVisible(chunk)) {
				for (const block of player.getVisibleBlocks()) {
					const instancedMesh = this.instancedMeshes.get(block.type);
					if (instancedMesh && instancedMesh.count < this.INSTANCES_PER_TYPE) {
						matrix.setPosition(block.position.x, block.position.y, block.position.z);
						instancedMesh.setMatrixAt(instancedMesh.count, matrix);
						instancedMesh.count++;
					}
				}
			}
		}

		// Update instance matrices
		for (const mesh of this.instancedMeshes.values()) {
			mesh.instanceMatrix.needsUpdate = true;
		}

		// Update world group rotation based on player rotation
		if (this.player) {
			this.worldGroup.rotation.y = -this.player.rotation;
		}

		// Set the active camera
		this.camera = this.player.camera;

		// Render the scene with camera
		this.renderer.render(this.scene, this.camera.getCamera());
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
		this.camera = player.camera;
		this.camera.attachToPlayer(player);
	}

	async initialize(world, player) {
		try {
			// Initialize texture manager first
			await this.textureManager.initialize();
			
			// Initialize skybox
			await this.skybox.initialize();
			
			// Set world and player
			this.setWorld(world);
			this.setPlayer(player);
			
			// Create block manager reference
			this.blockManager = world.blockManager;
			
			console.log('Renderer initialized successfully');
			return this;
		} catch (error) {
			console.error('Failed to initialize renderer:', error);
			throw error;
		}
	}
}
