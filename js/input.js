export class Input {
    constructor(engine) {
        this.engine = engine;
        this.keys = new Set();
        this.mouseMovement = { x: 0, y: 0 };
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;

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
    }

    onKeyUp(event) {
        this.keys.delete(event.code);
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
        if (!player) return;

        // Handle keyboard input
        const moveDirections = [];
        if (this.keys.has('KeyW')) moveDirections.push('forward');
        if (this.keys.has('KeyS')) moveDirections.push('backward');
        if (this.keys.has('KeyD')) moveDirections.push('right');
        if (this.keys.has('KeyA')) moveDirections.push('left');

        // Apply movement for each pressed direction
        for (const direction of moveDirections) {
            player.moveInDirection(direction);
        }

        // Handle mouse movement for rotation
        if (this.mouseMovement.x !== 0) {
            player.rotate(this.mouseMovement.x * this.mouseSensitivity);
            this.mouseMovement.x = 0;
        }

        // Handle jump
        if (this.keys.has('Space')) {
            player.jump();
        }

        // Reset mouse movement
        this.mouseMovement = { x: 0, y: 0 };
    }
}
