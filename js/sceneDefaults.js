import * as THREE from "three";

export class SceneDefaults {
	constructor() {
		// Create renderer
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColor(0x87ceeb); // Sky blue

		// Create scene
		this.scene = new THREE.Scene();

		// Add fog
		this.scene.fog = new THREE.Fog(0x87ceeb, 50, 250);

		// Setup lights
		this.setupLights();

		// Attach to DOM
		const container = document.getElementById('gameCanvas');
		if (!container) {
			throw new Error('Game canvas not found');
		}
		container.appendChild(this.renderer.domElement);

		// Handle window resizing
		window.addEventListener('resize', this.handleResize.bind(this));
	}

	setupLights() {
		// Add ambient light
		const ambient = new THREE.AmbientLight(0xffffff, 0.6);
		this.scene.add(ambient);

		// Add directional light (sun)
		const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
		sunLight.position.set(100, 100, 0);
		sunLight.castShadow = true;
		this.scene.add(sunLight);
	}

	handleResize() {
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	}

	getRenderer() {
		return this.renderer;
	}
}
