import EventEmitter from './utils/event_emitter.js';

class Engine {
    constructor() {
        this.eventEmitter = new EventEmitter();
        this.isRunning = false;
        this.lastTime = 0;
        this.world = null;
        this.player = null;
        this.renderer = null;
    }

    async init(world, player, renderer) {
        this.world = world;
        this.player = player;
        this.renderer = renderer;
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    reset() {
        // Emit a reset event instead of directly calling reset
        this.eventEmitter.emit('reset');
    }

    gameLoop() {
        if (!this.isRunning) return;
        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(deltaTime);
        this.render(deltaTime);

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Emit an update event
        this.eventEmitter.emit('update', deltaTime);
    }

    render(deltaTime) {
        // Emit a render event
        this.eventEmitter.emit('render', deltaTime);
    }

    getDistanceToPlayer(position) {
        return this.player.position.distanceTo(position);
    }

    // Expose the event emitter so other classes can subscribe
    getEventEmitter() {
        return this.eventEmitter;
    }
}
