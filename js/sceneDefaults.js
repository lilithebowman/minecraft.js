import * as THREE from "three";

export class SceneDefaults {
	constructor() {
		// setup //
		this.renderer = new THREE.WebGLRenderer({ alpha: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);

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
	}

	handleResize = () => {
		this.renderer.threeRenderer.setSize(window.innerWidth, window.innerHeight);
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	}

	setupScene = () => {
		/// lighting ///
		this.light = new THREE.AmbientLight(0xffaaff);
		this.light.position.set(10, 10, 10);
		this.scene.add(this.light);

		/// fog ///
		this.scene.fog = new THREE.Fog(0x87ceeb, 0, 500);

		/// background ///
		this.scene.background = new THREE.Color(0x87ceeb);

		/// skybox ///
		const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
		const skyboxMaterial = new THREE.MeshBasicMaterial({
			color: 0x87ceeb,
			side: THREE.BackSide,
		});
		const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
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
