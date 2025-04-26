import { Time } from './time.js';
import { Framerate } from './framerate.js';
import { BlockManager } from './blocks.js';
import { Input } from './input.js';
import { DebugLog } from './debug.js';
import { EventEmitter } from './utils/event_emitter.js';

export class Engine {
    constructor() {
        this.isRunning = false;
        this.time = new Time();
        this.framerate = new Framerate();
        this.blockManager = new BlockManager();
        this.maxBlocks = 10000;
        this.eventEmitter = new EventEmitter();  // Add this line
        
        // Store game objects
        this.world = null;
        this.player = null;
        this.renderer = null;
        this.input = null;
        this.debugLog = new DebugLog();
    }

    async init(world, player, renderer) {
        console.log('Initializing engine...');
        
        try {
            // Initialize texture manager first (through block manager)
            console.log('Initializing block manager and textures...');
            await this.blockManager.initialize();
            
            // Set up dependencies after textures are loaded
            this.world = world;
            this.player = player;
            this.renderer = renderer;

            // Set up dependencies
            this.world.blockManager = this.blockManager;
            this.renderer.blockManager = this.blockManager;
            this.renderer.setWorld(world);
            this.renderer.setPlayer(player);
            
            // Initialize input system
            this.input = new Input(this);
            
            console.log('Engine initialized successfully');
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
        if (!this.isRunning) return;

        // Update time tracking
        this.time.update();
        this.framerate.update();

        // Update game state
        this.update(this.time.deltaTime);

        // Render the current state
        this.render();

        // Queue next frame
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        if (this.player) {
            // Update player position display
            this.player.updatePositionDisplay();
        }
        
        // Emit an update event
        this.eventEmitter.emit('update', deltaTime);
    }

    render() {
        if (this.renderer) {
            // Update renderer's display list with current blocks
            this.renderer.clearDisplayList();
            
            // Get all blocks and sort by distance to player
            const blocks = this.world.getAllBlocks()
                .sort((a, b) => {
                    const distA = this.getDistanceToPlayer(a.position);
                    const distB = this.getDistanceToPlayer(b.position);
                    return distA - distB;
                })
                .slice(0, this.maxBlocks); // Limit to maxBlocks
            
            // Add closest blocks to display list
            for (const block of blocks) {
                const {type, position} = block;
                this.renderer.addBlock(position.x, position.y, position.z, type);
            }
            
            // Render the frame
            this.renderer.render();
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

