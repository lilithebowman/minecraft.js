import * as THREE from 'three';
import { Force } from './physics/force.js';
import { Position } from './physics/position.js';
import { Velocity } from './physics/velocity.js';

export class Player {
    constructor(position = new Position(0, 100, 0)) {
        this.position = position;
        this.velocity = new Velocity();
        this.size = { x: 0.6, y: 1.8, z: 0.6 }; // Player's bounding box size
        this.rotation = 0;
        this.forward = new THREE.Vector3(0, 0, -1);
        this.right = new THREE.Vector3(1, 0, 0);
        this.isGrounded = false;
    }

    createPositionDisplay() {
        // Create position display element
        this.posDisplay = document.createElement('div');
        this.posDisplay.style.position = 'fixed';
        this.posDisplay.style.top = '50px'; // Below block counter
        this.posDisplay.style.right = '10px';
        this.posDisplay.style.color = 'white';
        this.posDisplay.style.fontFamily = 'monospace';
        this.posDisplay.style.fontSize = '16px';
        this.posDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.posDisplay.style.padding = '5px';
        this.posDisplay.style.zIndex = '100';
        document.body.appendChild(this.posDisplay);
        this.updatePositionDisplay();
    }

    updatePositionDisplay() {
        if (this.posDisplay) {
            const x = Math.round(this.position.x * 10) / 10;
            const y = Math.round(this.position.y * 10) / 10;
            const z = Math.round(this.position.z * 10) / 10;
            this.posDisplay.textContent = `Position: ${x}, ${y}, ${z}`;
        }
    }

    update(deltaTime) {
        // Update position display
        this.updatePositionDisplay();
        // ... rest of update logic
    }

    // ... existing methods ...
}

export default Player;