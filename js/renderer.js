import * as THREE from 'three';
import { BlockMeshRenderer, Framerate, Frustum, SceneDefaults, TextureManager } from './modules.js';
import { debug } from './debug.js';

export class Renderer {
	constructor(engine) {
		// Maximum number of chunks to render
		this.minChunks = 1;
		this.maxChunks = 4;

		// Limit FPS to 60
		this.fpsLimit = 60;
		this.fpsInterval = 1000 / this.fpsLimit;
		this.lastRenderTime = 0;

		// Initialize the engine
		this.engine = engine;
		this.player = this.engine?.player;
		this.world = this.engine?.world;

		// Create the scene
		this.scene = new THREE.Scene();
		this.sceneDefaults = new SceneDefaults(this.engine?.player)
		while (!this.sceneDefaults) {
			this.scene = this.sceneDefaults.getScene();
			this.scene.children = [];
			this.sceneDefaults.setupScene();
			this.threeRenderer = this.sceneDefaults.getRenderer();
		}

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

		// Create another canvas for rendering a PIP in the corner
		this.pipCanvas = document.createElement('canvas', { className: 'pipCanvas' });
		this.pipCanvas.style.position = 'absolute';
		this.pipCanvas.style.bottom = '10px';
		this.pipCanvas.style.right = '10px';
		this.pipCanvas.style.zIndex = '9000';
		this.pipCanvas.style.pointerEvents = 'none'; // Prevent mouse events
		this.pipCanvas.style.border = '2px solid white';
		this.pipCanvas.style.borderRadius = '5px';
		this.pipCanvas.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
		this.pipCanvas.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)'; // Shadow effect
		this.pipCanvas.style.width = '200px';
		this.pipCanvas.style.height = '200px';
		this.pipCanvas.width = 200;
		this.pipCanvas.height = 200;
		this.pipContext = this.pipCanvas.getContext('2d');
		this.pipTexture = new THREE.Texture(this.pipCanvas);
		this.pipTexture.needsUpdate = true;
		this.pipCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
		this.pipCamera.position.set(0, 0, 5);
		this.pipCamera.lookAt(0, 0, 0);
		this.pipScene = new THREE.Scene();
		this.pipScene.add(this.pipCamera);
		this.pipMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			new THREE.MeshBasicMaterial({ map: this.pipTexture })
		);
		this.pipMesh.position.set(0, 0, -5);
		this.pipScene.add(this.pipMesh);
		this.pipCamera.updateProjectionMatrix();
		this.pipRenderer = new THREE.WebGLRenderer({ alpha: true });
		this.pipRenderer.setSize(this.pipCanvas.width, this.pipCanvas.height);
		this.pipRenderer.setPixelRatio(window.devicePixelRatio);
		this.pipRenderer.setClearColor(0x000000, 0); // Transparent background
		this.pipRenderer.render(this.pipScene, this.pipCamera);
		document.body.appendChild(this.pipCanvas);
	}

	// Handle window resizing
	handleResize() {
		if (this.threeRenderer) {
			this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
			this.player.camera.aspect = window.innerWidth / window.innerHeight;
		}
	}

	// Render the scene
	render(deltaTime) {
		if (!this.engine || !this.engine.player) {
			console.error('Engine or player is not defined in render');
			debugger;
		}

		// Update framerate stats
		this.framerate.update();

		// Update worldGroup with visible chunks
		this.worldGroup.children = [];
		for (const chunk of this.world.chunks) {
			console.log('chunk');
			for (const block of chunk.getBlocks()) {
				console.log('block');
				const blockMesh = this.blockMeshRenderer.getBlockMesh(block);
				if (blockMesh) {
					this.worldGroup.add(blockMesh);
					console.log(blockMesh);
					debugger;
				}
			}
		}

		console.warn(this.worldGroup.children);
		debugger;

		// Add worldGroup to the scene
		this.scene.add(this.worldGroup);

		// Render the scene
		this.threeRenderer = this.sceneDefaults.getRenderer();
		this.threeRenderer.render(this.scene, this.player.camera);

		this.pipScene.add(this.worldGroup);
		this.pipRenderer.render(this.pipScene, this.pipCamera);
		return true;
	}

	dumpScene() {
		console.log(this.scene);
		console.log(this.worldGroup);
		console.log(this.player);
		console.log(this.world.chunks);
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
}
