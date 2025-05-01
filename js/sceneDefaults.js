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

		this.setupScene();
	}

	handleResize = () => {
		this.renderer.threeRenderer.setSize(window.innerWidth, window.innerHeight);
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	}

	setupScene = (player) => {
		if (!player) {
			console.error("Player is not defined");
			return false;
		}
		if (!player?.camera) {
			// Set up a new camera if one doesn't exist
			player.camera = new THREE.PerspectiveCamera(
				45,
				window.innerWidth / window.innerHeight,
				1,
				10000
			);
			player.camera.position.set(0, 0, 0);
			player.camera.lookAt(0, 0, 0);
			player.forward = new THREE.Vector3(0, 0, -1);
			player.camera.updateProjectionMatrix();
		}
		camera.position.set(player.camera.position.x, player.camera.position.y, player.camera.position.z);
		camera.lookAt(player.forward.x, player.forward.y, player.forward.z);

		this.renderer.render(scene, camera);

		/// lighting ///

		this.light = new THREE.AmbientLight(0xffaaff);
		this.light.position.set(10, 10, 10);
		this.scene.add(light);

		/// geometry ///

		this.boxGeometry = new THREE.Mesh(
			new THREE.BoxGeometry(100, 100, 100),
			new THREE.MeshBasicMaterial({ color: 0xff0000 })
		);
		this.scene.add(boxGeometry);
	}
}
