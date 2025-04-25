import * as THREE from 'three';
import { Force } from './modules.js';

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
        
        // Add forces array
        this.forces = [];
        
        // Add gravity force
        this.gravity = new Force(new THREE.Vector3(0, -1, 0), 20);

        // Initialize directional vectors
        this.forward = new THREE.Vector3(0, 0, -1);
        this.right = new THREE.Vector3(1, 0, 0);
        this.rotation = 0; // Rotation around Y axis in radians
        
        // Update vectors initially
        this.updateVectors();

        // Create position display
        this.createPositionDisplay();

        // Add collision properties
        this.boundingBox = new THREE.Box3();
        this.playerHeight = 1.8;
        this.playerWidth = 0.6;
        this.updateBoundingBox();

        // Add frozen state
        this.isFrozen = true;
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
        this.velocity.add(totalForce.multiplyScalar(dt));

        // Update position based on velocity
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        // Apply friction
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;

        // Reset grounded state each frame
        this.isGrounded = false;

        // Update bounding box
        this.updateBoundingBox();

        // Update position display
        this.updatePositionDisplay();
    }

    updateBoundingBox() {
        this.boundingBox.setFromCenterAndSize(
            this.position,
            new THREE.Vector3(this.playerWidth, this.playerHeight, this.playerWidth)
        );
    }
}

export default Player;