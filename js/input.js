import { Force } from './modules.js';
import * as THREE from 'three';

export class Input {
    constructor(engine) {
        this.engine = engine;
        this.keys = new Set();
        this.mouseMovement = { x: 0, y: 0 };
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;

        // Add flying and freezing states
        this.isFlying = false;
        this.isFrozen = false;

        // Add flying force
        this.movementForces = {
            forward: new Force(new THREE.Vector3(0, 0, -1), 5),
            backward: new Force(new THREE.Vector3(0, 0, 1), 5),
            left: new Force(new THREE.Vector3(-1, 0, 0), 5),
            right: new Force(new THREE.Vector3(1, 0, 0), 5),
            jump: new Force(new THREE.Vector3(0, 1, 0), 10, 0.2),
            fly: new Force(new THREE.Vector3(0, 1, 0), 5) // Continuous upward force
        };

        // Bind methods to maintain context
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);

        // Initialize input handlers
        this.init();
    }

    init() {
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        
        // Mouse events
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('click', () => this.requestPointerLock());
        document.addEventListener('pointerlockchange', this.onPointerLockChange);
    }

    onKeyDown(event) {
        this.keys.add(event.code);
        console.log(`Key pressed: ${event.code}`);
        
        // Handle flying toggle
        if (event.code === 'Space') {
            this.isFlying = true;
            console.log('Flying enabled');
        }

        // Handle freeze toggle
        if (event.code === 'KeyF') {
            this.isFrozen = !this.isFrozen;
            console.log(`Player ${this.isFrozen ? 'frozen' : 'unfrozen'}`);
            if (this.isFrozen) {
                // Clear all forces when frozen
                this.engine.player.clearForces();
                this.engine.player.velocity.set(0, 0, 0);
            }
        }
    }

    onKeyUp(event) {
        this.keys.delete(event.code);
        console.log(`Key released: ${event.code}`);
        
        // Stop flying when space is released
        if (event.code === 'Space') {
            this.isFlying = false;
            console.log('Flying disabled');
        }
    }

    onMouseMove(event) {
        if (this.isPointerLocked) {
            // Add mouse movement to accumulator
            this.mouseMovement.x += event.movementX;
            this.mouseMovement.y += event.movementY;
        }
    }

    requestPointerLock() {
        document.body.requestPointerLock();
    }

    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement !== null;
    }

    destroy() {
        // Remove all event listeners
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    }

    update() {
        const player = this.engine.player;
        if (!player || this.isFrozen) return;

        // Handle keyboard input and apply forces
        if (this.keys.has('KeyW')) {
            const force = this.movementForces.forward.clone();
            force.setDirection(player.forward);
            player.addForce(force);
        }
        if (this.keys.has('KeyS')) {
            const force = this.movementForces.backward.clone();
            force.setDirection(player.forward.clone().multiplyScalar(-1));
            player.addForce(force);
        }
        if (this.keys.has('KeyD')) {
            const force = this.movementForces.right.clone();
            force.setDirection(player.right);
            player.addForce(force);
        }
        if (this.keys.has('KeyA')) {
            const force = this.movementForces.left.clone();
            force.setDirection(player.right.clone().multiplyScalar(-1));
            player.addForce(force);
        }

        // Handle flying
        if (this.isFlying && !player.isGrounded) {
            player.addForce(this.movementForces.fly.clone());
        }

        // Handle jump
        if (this.keys.has('Space') && player.isGrounded) {
            player.addForce(this.movementForces.jump.clone());
        }

        // Handle mouse movement for rotation
        if (Math.abs(this.mouseMovement.x) > 0.01) {
            player.rotate(this.mouseMovement.x * this.mouseSensitivity);
            this.mouseMovement.x = 0;
        }

        // Reset mouse movement
        this.mouseMovement = { x: 0, y: 0 };
    }
}
