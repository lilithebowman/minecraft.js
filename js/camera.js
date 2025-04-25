import * as THREE from 'three';

export class Camera {
    constructor() {
        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight,
            0.1, // Near plane
            1000 // Far plane
        );

        // Set initial position and rotation
        this.camera.position.set(0, 100, 100);
        this.camera.lookAt(0, 0, 0);

        // Add resize handler
        window.addEventListener('resize', () => this.handleResize());
    }

    attachToPlayer(player) {
        this.player = player;
        this.updatePosition();
    }

    updatePosition() {
        if (!this.player) return;

        // Position camera relative to player
        const offset = new THREE.Vector3(0, 2, 0); // Camera height above player
        this.camera.position.copy(this.player.position).add(offset);
        
        // Update camera rotation based on player's rotation
        const lookAt = new THREE.Vector3();
        lookAt.copy(this.player.position)
            .add(offset)
            .add(this.player.forward.multiplyScalar(10));
        this.camera.lookAt(lookAt);
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    getCamera() {
        return this.camera;
    }
}
