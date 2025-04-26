import { Time } from './time.js';
import { Framerate } from './framerate.js';
import { Block } from './blocks.js';
import { Input } from './input.js';
import { debug } from './debug.js';
import { EventEmitter } from './utils/event_emitter.js';

export class Engine {
    constructor() {
        this.isRunning = false;
        this.time = new Time();
        this.framerate = new Framerate();
        this.block = new Block();
        this.maxBlocks = 10000;
        this.eventEmitter = new EventEmitter();
        
        // Store game objects
        this.world = null;
        this.player = null;
        this.renderer = null;
        this.input = null;
        this.maxTicks = 1000;
        this.tickRate = 1000 / 60; // 60 FPS
        this.tickCount = 0;
        this.lastTickTime = 0;
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
            await this.block.initialize();
            
            // Set up components
            this.world = world;
            this.player = player;
            this.renderer = renderer;

            // Initialize world with block manager
            console.log('Initializing world...');
            await this.world.initialize(this.block);
            console.log('World initialized');

            // Position player on top of center chunk
            const centerX = 0;
            const centerZ = 0;
            const surfaceY = this.findSurfaceHeight(centerX, centerZ);
            
            this.player.position.set(
                centerX,
                surfaceY + 1, // Place slightly above surface to prevent falling through
                centerZ
            );
            console.log(`Positioned player at ${centerX}, ${surfaceY + 1}, ${centerZ}`);

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
        // Check if the last tick time has passed
        if (this.time.currentTime - this.lastTickTime >= this.tickRate) {
            this.tickCount++;
            this.lastTickTime = this.time.currentTime;
        }
        // Limit the number of ticks to prevent lag
        if (this.tickCount > this.maxTicks) {
            this.tickCount = 0;
            return;
        }

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
        this.updateGameState(this.time.deltaTime);

        // Render the current state
        this.renderer.render(this.time.deltaTime);

        // Queue next frame
        requestAnimationFrame(() => this.gameLoop());
    }

    updateGameState(deltaTime) {
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

    // Add this helper method to find the surface height
    findSurfaceHeight(x, z) {
        if (!this.world) return 64; // Default height if world not ready
        
        // Start from max height and scan down
        for (let y = 255; y >= 0; y--) {
            const block = this.world.getBlock(x, y, z);
            if (block) {
                return y;
            }
        }
        return 64; // Fallback height if no blocks found
    }
}

