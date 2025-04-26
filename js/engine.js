import { Time } from './time.js';
import { Framerate } from './framerate.js';
import { BlockManager } from './blocks.js';
import { Input } from './input.js';
import { debug } from './debug.js';
import { EventEmitter } from './utils/event_emitter.js';

export class Engine {
    constructor() {
        this.isRunning = false;
        this.time = new Time();
        this.framerate = new Framerate();
        this.blockManager = new BlockManager();
        this.maxBlocks = 10000;
        this.eventEmitter = new EventEmitter();
        
        // Store game objects
        this.world = null;
        this.player = null;
        this.renderer = null;
        this.input = null;
    }

    async init(world, player, renderer) {
        console.log('Initializing engine...');
        
        try {
            // Validate required components with detailed errors
            if (!world) throw new Error('World object is required for engine initialization');
            if (!player) throw new Error('Player object is required for engine initialization');
            if (!renderer) throw new Error('Renderer object is required for engine initialization');

            // Initialize block manager first
            console.log('Initializing block manager and textures...');
            await this.blockManager.initialize();
            
            // Set up components
            this.world = world;
            this.player = player;
            this.renderer = renderer;

            // Initialize world with block manager
            console.log('Initializing world...');
            await this.world.initialize(this.blockManager);
            console.log('World initialized');

            // Initialize renderer
            try {
                await this.renderer.initialize(world, player);
                // Initialize engine events
                this.renderer.initialize(this.world, this.player);
                console.log('Renderer initialized');
            } catch (error) {
                throw new Error(`Renderer initialization failed: ${error.message}`);
            }

            // Initialize input system last
            try {
                this.input = new Input(this);
                console.log('Input system initialized');
            } catch (error) {
                throw new Error(`Input system initialization failed: ${error.message}`);
            }
            
            console.log('Engine initialization complete');
            return this;

        } catch (error) {
            console.error('Failed to initialize engine:', error);
            throw error;
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.time = new Time();
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            this.time = null;
            this.framerate.destroy();
            if (this.input) {
                this.input.destroy();
                this.input = null;
            }
        }
    }

    reset() {
        this.stop();
        this.start();
    }

    // Main game loop
    gameLoop() {
        if (!this.isRunning || !this.player || !this.world || !this.renderer) {
            console.warn('Game loop stopped: missing required components');
            this.isRunning = false;
            return;
        }

        // Update time tracking
        this.time.update();
        this.framerate.update();

        // Update input first
        if (this.input) {
            this.input.update();
        }

        // Update game state
        this.update(this.time.deltaTime);

        // Render the current state
        this.renderer.render(this.time.deltaTime);

        // Queue next frame
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        try {
            // Update player
            if (this.player) {
                this.player.update(deltaTime);
            }

            // Update world
            if (this.world) {
                this.world.update(deltaTime);
            }
            
            // Emit update event
            this.eventEmitter.emit('update', deltaTime);
        } catch (error) {
            console.error('Error in update loop:', error);
            this.stop();
        }
    }

    getDistanceToPlayer(position) {
        if (!this.player) return Infinity;
        const dx = this.player.position.x - position.x;
        const dy = this.player.position.y - position.y;
        const dz = this.player.position.z - position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    getEventEmitter() {
        return this.eventEmitter;
    }
}

