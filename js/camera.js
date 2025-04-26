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

        this.rotation = 0;
        this.pitch = 0;
    }

    updateRotation(rotation, pitch) {
        this.rotation = rotation;
        this.pitch = pitch;
        this.updatePosition();
    }

    updatePosition() {
        if (!this.player) return;

        // Position camera at player eye level
        const playerPos = this.player.position;
        
        // Calculate camera position based on rotation and pitch
        const distance = 100; // Distance from player
        const heightOffset = Math.sin(this.pitch) * distance;
        const horizontalDistance = Math.cos(this.pitch) * distance;
        
        const x = playerPos.x - horizontalDistance * Math.sin(this.rotation);
        const z = playerPos.z - horizontalDistance * Math.cos(this.rotation);
        const y = playerPos.y + heightOffset;
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(playerPos);
        
        // Rotate the background to match camera rotation
        if (this.camera.parent && this.camera.parent.background) {
            this.camera.parent.background.rotation.y = -this.rotation;
        }
    }

    /**
     * Returns the THREE.PerspectiveCamera instance
     * @returns {THREE.PerspectiveCamera} The camera instance
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Attaches the camera to a player
     * @param {Player} player - The player to attach the camera to
     */
    attachToPlayer(player) {
        this.player = player;
        
        // Initial camera setup at player position
        const eyeHeight = 1.6;
        this.camera.position.set(
            player.position.x,
            player.position.y + eyeHeight,
            player.position.z
        );
        
        // Initial look direction
        const lookAt = new THREE.Vector3(
            Math.sin(this.rotation) * Math.cos(this.pitch),
            Math.sin(this.pitch),
            -Math.cos(this.rotation) * Math.cos(this.pitch)
        );
        
        const target = new THREE.Vector3();
        target.copy(this.camera.position).add(lookAt);
        this.camera.lookAt(target);
    }
}
