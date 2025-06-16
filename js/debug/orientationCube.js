import * as THREE from 'three';

export class OrientationCube {
	constructor(player) {
		this.player = player;

		// Create scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);

		// Create camera
		this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
		this.camera.position.set(0, 0, 3);

		// Create renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(100, 100);

		// Create cube
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const materials = [
			new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }), // Right - Red
			new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }), // Left - Green
			new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true }), // Top - Blue
			new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true }), // Bottom - Yellow
			new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true }), // Front - Purple
			new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true }), // Back - Cyan
		];
		this.cube = new THREE.Mesh(geometry, materials);
		this.scene.add(this.cube);

		// Add to DOM
		const container = document.getElementById('debugCanvas');
		container.appendChild(this.renderer.domElement);

		// Start animation
		this.animate();
	}

	animate = () => {
		if (!this.player?.camera) return;

		// Update cube rotation to match player camera
		this.cube.rotation.x = this.player.pitch;
		this.cube.rotation.y = this.player.rotation;

		// Render
		this.renderer.render(this.scene, this.camera);

		requestAnimationFrame(this.animate);
	}

	dispose() {
		this.renderer.dispose();
		this.cube.geometry.dispose();
		this.cube.material.forEach(m => m.dispose());
		this.scene = null;
		this.camera = null;
	}
}