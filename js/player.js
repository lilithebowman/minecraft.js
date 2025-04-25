import * as THREE from 'three';
import { Force } from './physics/force.js';
import { Position } from './physics/position.js';
import { Velocity } from './physics/velocity.js';

export class Player {
    constructor(name, health = 100, position) {
        this.name = name;
        this.health = health;
        this.position = new Position(0, 5, 0);
        this.velocity = new Velocity();
        this.acceleration = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0 };
        this.forward = new THREE.Vector3(0, 0, 1);
        this.right = new THREE.Vector3(1, 0, 0);
        this.up = new THREE.Vector3(0, 1, 0);
        // Fix gravity force initialization
        this.gravity = new Force(new THREE.Vector3(0, -1, 0), 9.81);
        this.forces = [];

        const boxSizeX = 1;
        const boxSizeY = 2;
        const boxSizeZ = 1;
        this.boundingBox = new THREE.Box3(
            new THREE.Vector3(-boxSizeX / 2, -boxSizeY / 2, -boxSizeZ / 2),
            new THREE.Vector3(boxSizeX / 2, boxSizeY / 2, boxSizeZ / 2)
        );

        this.element = null;
        this.jumpForce = 7;
        this.isGrounded = false;

        this.createPositionDisplay();
        this.updateVectors();
        this.updateBoundingBox();
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
            const pos = this.position;
            this.positionDisplay.textContent = 
                `Position: (${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)})`;
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

    addForce(force) {
        this.forces.push(force);
        console.log('Player is moving');
    }

    clearForces() {
        this.forces = [];
        console.log('Player is frozen');
        this.velocity.set(0, 0, 0);
    }

    // Add position limits as static properties
    static MAX_POSITION = Number.MAX_SAFE_INTEGER;  // About 9 quadrillion
    static MIN_POSITION = Number.MIN_SAFE_INTEGER;

    clampPosition() {
        // Clamp each coordinate to safe integer range
        this.position.x = Math.min(Math.max(this.position.x, Player.MIN_POSITION), Player.MAX_POSITION);
        this.position.y = Math.min(Math.max(this.position.y, Player.MIN_POSITION), Player.MAX_POSITION);
        this.position.z = Math.min(Math.max(this.position.z, Player.MIN_POSITION), Player.MAX_POSITION);

        // Check for NaN values
        if (isNaN(this.position.x)) this.position.x = 0;
        if (isNaN(this.position.y)) this.position.y = 0;
        if (isNaN(this.position.z)) this.position.z = 0;
    }

    update(deltaTime) {
        // If frozen, only update display and return
        if (this.isFrozen) {
            this.updatePositionDisplay();
            return;
        }

        // Convert deltaTime to seconds
        const dt = deltaTime / 1000;

        // Store original position for collision response
        const originalPosition = this.position.clone();

        // Apply all active forces
        const totalForce = new THREE.Vector3();

        // Always apply gravity if not grounded
        if (!this.isGrounded) {
            totalForce.add(this.gravity.update(dt));
        }

        // Apply other forces and remove expired ones
        this.forces = this.forces.filter(force => {
            const forceVector = force.update(dt);
            totalForce.add(forceVector);
            return !force.isExpired;
        });

        // Update velocity based on forces
        this.velocity.add(totalForce);

        // Update position based on velocity
        const movement = this.velocity.vector.clone().multiplyScalar(dt);
        this.position.add(movement);
        
        // Clamp position to safe values
        this.clampPosition();

        // Apply friction
        this.velocity.vector.x *= 0.9;
        this.velocity.vector.z *= 0.9;

        // Reset grounded state each frame
        this.isGrounded = false;

        // Update bounding box
        this.updateBoundingBox();

        // Update position display
        this.updatePositionDisplay();

        // Debug movement
        if (this.velocity.vector.length() > 0) {
            console.log('Velocity:', this.velocity.vector);
            console.log('Position:', this.position);
        }

        // Debug logging for vertical position
        if (this.position.y < -1000) {
            console.log(`Player at Y=${this.position.y}, near bedrock level`);
        }
    }

    updateBoundingBox() {
        const halfWidth = 0.5;  // Half of boxSizeX
        const halfHeight = 1.0; // Half of boxSizeY
        const halfDepth = 0.5;  // Half of boxSizeZ

        // Update bounding box to match current position
        this.boundingBox.set(
            new THREE.Vector3(
                this.position.x - halfWidth,
                this.position.y - halfHeight,
                this.position.z - halfDepth
            ),
            new THREE.Vector3(
                this.position.x + halfWidth,
                this.position.y + halfHeight,
                this.position.z + halfDepth
            )
        );
    }
}

export default Player;