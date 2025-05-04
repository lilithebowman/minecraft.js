import * as THREE from "three";

export class SceneDefaults {
	constructor() {
		console.log("Initializing scene defaults...");

		// setup //
		// Renderer setup
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);

		this.scene = new THREE.Scene();
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.camera = new THREE.PerspectiveCamera(
			45,
			window.innerWidth / window.innerHeight,
			1,
			10000
		);
		this.light = null;

		this.geometry = null;
		this.material = null;
		this.cube = null;
		this.skyboxGeometry = null;
		this.skyboxMaterial = null;
		this.skybox = null;
		this.sunLight = null;
		this.pointLight = null;
		this.container = null;
		this.worldGroup = null;
		this.addlightsAndSkybox();

		// Attach the renderer to the DOM
		this.container = document.getElementById('gameCanvas');
		this.container.appendChild(this.renderer.domElement);
	}

	addlightsAndSkybox() {
		// Add a cube
		this.geometry = new THREE.BoxGeometry();
		this.material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
		this.cube = new THREE.Mesh(this.geometry, this.material);
		this.scene.add(this.cube);

		// Add a skybox
		this.skyboxGeometry = new THREE.BoxGeometry(100, 100, 100);
		this.skyboxMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
		this.skybox = new THREE.Mesh(this.skyboxGeometry, this.skyboxMaterial);
		this.scene.add(this.skybox);

		// Add a sun light (directional light)
		this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
		this.sunLight.position.set(10, 10, 10);
		this.scene.add(this.sunLight);

		// Add a point light
		this.pointLight = new THREE.PointLight(0xffaa00, 1, 50);
		this.pointLight.position.set(0, 5, 0);
		this.scene.add(this.pointLight);
	}

	handleResize = () => {
		this.renderer.threeRenderer.setSize(window.innerWidth, window.innerHeight);
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	}

	setupScene = () => {
		console.log("Setting up scene...");

		/// lighting ///
		this.light = new THREE.AmbientLight(0xffaaff);
		this.light.position.set(10, 10, 10);
		this.scene.add(this.light);

		/// fog ///
		this.scene.fog = new THREE.Fog(0x87ceeb, 0, 500);

		/// background ///
		this.scene.background = new THREE.Color(0x87ceeb);

		/// skybox ///
		this.skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
		this.skyboxMaterial = new THREE.MeshBasicMaterial({
			color: 0x87ceeb,
			side: THREE.BackSide,
		});
		this.skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
		this.scene.add(skybox);
		this.scene.add(this.light);

		return this.scene;
	}

	/* Getters and setters */
	getRenderer() {
		return this.renderer;
	}

	getCamera() {
		return this.camera;
	}

	getScene() {
		return this.scene;
	}

	getLight() {
		return this.light;
	}
}
