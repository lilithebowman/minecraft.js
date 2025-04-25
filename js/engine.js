import { Time } from './time.js';
import { Framerate } from './framerate.js';
import { BlockManager } from './blocks.js';

export class Engine {
    constructor() {
        this.isRunning = false;
        this.time = new Time();
        this.framerate = new Framerate();
        this.blockManager = new BlockManager();
        this.maxBlocks = 1000; // Maximum blocks to render
        
        // Store game objects
        this.world = null;
        this.player = null;
        this.renderer = null;
        console.log('Engine initialized'); // Debug log
    }

    init(world, player, renderer) {
        this.world = world;
        this.player = player;
        this.renderer = renderer;
        this.world.blockManager = this.blockManager;
        this.renderer.setPlayer(player);

        // Debug logs
        console.log('World chunks:', this.world.chunks.size);
        console.log('Player position:', this.player.position);
        console.log('Renderer initialized:', !!this.renderer);
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
        if (this.world) {
            this.world.update(deltaTime);
            // Update block count after world update
            this.blockManager.updateDisplay();
        }
        if (this.player) this.player.update(deltaTime);
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
}

