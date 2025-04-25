import * as THREE from 'three';

export class Player {
    constructor(name, health = 100, position = { x: 0, y: 0, z: 0 }) {
        this.name = name;
        this.health = health;
        
        // Convert position to Vector3
        this.position = new THREE.Vector3(position.x, position.y, position.z);
        
        // Use Vector3 for velocity
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.moveSpeed = 5;
        this.jumpForce = 10;
        this.gravity = -20;
        this.isGrounded = false;

        // Initialize directional vectors properly
        this.forward = new THREE.Vector3(0, 0, -1);
        this.right = new THREE.Vector3(1, 0, 0);
        this.rotation = 0;
        
        // Initialize vectors
        this.updateVectors();

        // Create position display
        this.createPositionDisplay();
    }

    createPositionDisplay() {
        this.positionDisplay = document.createElement('div');
        this.positionDisplay.style.position = 'fixed';
        this.positionDisplay.style.bottom = '10px';
        this.positionDisplay.style.left = '10px';
        this.positionDisplay.style.color = 'white';
        this.positionDisplay.style.fontFamily = 'monospace';
        this.positionDisplay.style.fontSize = '16px';
        this.positionDisplay.style.zIndex = '100';
        document.body.appendChild(this.positionDisplay);
        this.updatePositionDisplay();
    }

    updatePositionDisplay() {
        if (this.positionDisplay) {
            this.positionDisplay.textContent = `Position: (${Math.round(this.position.x)}, ${Math.round(this.position.y)}, ${Math.round(this.position.z)})`;
        }
    }

    updateVectors() {
        // Update forward vector based on rotation
        this.forward.set(
            Math.sin(this.rotation),
            0,
            -Math.cos(this.rotation)
        ).normalize();
        
        // Update right vector (cross product of world up and forward)
        const up = new THREE.Vector3(0, 1, 0);
        this.right.crossVectors(this.forward, up).normalize();
    }

    rotate(deltaRotation) {
        this.rotation += deltaRotation;
        // Keep rotation between 0 and 2π
        this.rotation = this.rotation % (Math.PI * 2);
        // Update movement vectors based on new rotation
        this.updateVectors();
    }

    // Update the movement method
    moveInDirection(direction) {
        const speed = this.moveSpeed;
        const movement = new THREE.Vector3();
        
        switch(direction) {
            case 'forward':
                movement.copy(this.forward).multiplyScalar(speed);
                break;
            case 'backward':
                movement.copy(this.forward).multiplyScalar(-speed);
                break;
            case 'right':
                movement.copy(this.right).multiplyScalar(speed);
                break;
            case 'left':
                movement.copy(this.right).multiplyScalar(-speed);
                break;
        }

        // Add movement to velocity
        this.velocity.add(movement);
    }

    update(deltaTime) {
        // Convert deltaTime to seconds
        const dt = deltaTime / 1000;

        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * dt;
        }

        // Update position based on velocity
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        // Basic ground collision
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // Apply friction
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;

        // Update position display
        this.updatePositionDisplay();
    }
}

export default Player;