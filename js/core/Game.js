import { World } from './World.js';
import { Player } from './Player.js';
import { Camera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { UIManager } from './UIManager.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

/**
 * Main Game class - Orchestrates all game systems
 */
export class Game {
	constructor() {
		this.viewport = document.getElementById('viewport');
		this.worldElement = document.getElementById('world');

		this.isRunning = false;
		this.isPaused = false;
		this.lastTime = 0;
		this.targetFPS = 60;
		this.frameTime = 1000 / this.targetFPS;

		// Core game systems
		this.world = null;
		this.player = null;
		this.camera = null;
		this.inputManager = null;
		this.uiManager = null;
		this.performanceMonitor = null;

		// Bind methods
		this.gameLoop = this.gameLoop.bind(this);
		this.handleResize = this.handleResize.bind(this);
		this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
	}

	/**
	 * Initialize and start the game
	 */
	async start() {
		if (this.isRunning) return;

		try {
			console.log('Starting Minecraft.js CSS Edition...');

			// Show loading screen
			this.showLoadingScreen();

			// Initialize systems
			await this.initializeSystems();

			// Set up event listeners
			this.setupEventListeners();

			// Start game loop
			this.isRunning = true;
			this.lastTime = performance.now();
			this.gameLoop();

			// Hide loading screen
			this.hideLoadingScreen();

			console.log('Game started successfully!');

		} catch (error) {
			console.error('Failed to start game:', error);
			this.hideLoadingScreen();
			throw error;
		}
	}    /**
     * Initialize all game systems with progress tracking
     */
    async initializeSystems() {
        const loadingSteps = [
            { name: 'Performance Monitor', weight: 5 },
            { name: 'World', weight: 40 },
            { name: 'Player', weight: 15 },
            { name: 'Camera', weight: 10 },
            { name: 'Input Manager', weight: 15 },
            { name: 'UI Manager', weight: 10 },
            { name: 'Connections', weight: 5 }
        ];

        let totalProgress = 0;
        const updateProgress = (stepProgress, stepWeight) => {
            const progress = (totalProgress + (stepProgress * stepWeight)) / 100;
            this.updateLoadingProgress(progress * 100);
        };

        // Initialize performance monitor
        this.performanceMonitor = new PerformanceMonitor();
        totalProgress += loadingSteps[0].weight;
        updateProgress(1, 0);

        // Initialize world (this takes the longest)
        this.world = new World(this.worldElement);
        updateProgress(0.5, loadingSteps[1].weight);
        await this.world.initialize();
        totalProgress += loadingSteps[1].weight;
        updateProgress(1, 0);

        // Initialize player
        this.player = new Player();
        updateProgress(0.5, loadingSteps[2].weight);
        await this.player.initialize();
        totalProgress += loadingSteps[2].weight;
        updateProgress(1, 0);

        // Initialize camera
        this.camera = new Camera(this.viewport);
        updateProgress(0.5, loadingSteps[3].weight);
        await this.camera.initialize();
        totalProgress += loadingSteps[3].weight;
        updateProgress(1, 0);

        // Initialize input manager
        this.inputManager = new InputManager();
        updateProgress(0.5, loadingSteps[4].weight);
        await this.inputManager.initialize();
        totalProgress += loadingSteps[4].weight;
        updateProgress(1, 0);

        // Initialize UI manager
        this.uiManager = new UIManager();
        updateProgress(0.5, loadingSteps[5].weight);
        await this.uiManager.initialize();
        totalProgress += loadingSteps[5].weight;
        updateProgress(1, 0);

        // Connect input events to game systems
        this.connectInputEvents();
        totalProgress += loadingSteps[6].weight;
        updateProgress(1, 0);

        this.updateLoadingProgress(100);
    }

	/**
	 * Connect input events to game systems
	 */
	connectInputEvents() {
		// Player movement
		this.inputManager.on('move', (direction) => {
			this.player.move(direction);
		});

		this.inputManager.on('stopmove', (direction) => {
			this.player.stopMove(direction);
		});

		this.inputManager.on('look', (delta) => {
			this.player.look(delta);
		});

		this.inputManager.on('jump', () => {
			this.player.jump();
		});

		this.inputManager.on('sprint', (state) => {
			this.player.sprint(state);
		});

		this.inputManager.on('sneak', (state) => {
			this.player.sneak(state);
		});

		// Block interaction
		this.inputManager.on('leftclick', (mousePos) => {
			this.handleBlockBreak(mousePos);
		});

		this.inputManager.on('rightclick', (mousePos) => {
			this.handleBlockPlace(mousePos);
		});

		// UI events
		this.inputManager.on('toggledebug', () => {
			this.uiManager.toggleDebug();
		});
	}

	/**
	 * Set up window event listeners
	 */
	setupEventListeners() {
		window.addEventListener('resize', this.handleResize);
		document.addEventListener('visibilitychange', this.handleVisibilityChange);

		// Handle F3 key for debug toggle
		document.addEventListener('keydown', (event) => {
			if (event.key === 'F3') {
				event.preventDefault();
				this.uiManager.toggleDebug();
			}
		});
	}

	/**
	 * Main game loop
	 */
	gameLoop() {
		if (!this.isRunning) return;

		const currentTime = performance.now();
		const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
		this.lastTime = currentTime;

		if (!this.isPaused) {
			// Update performance monitor
			this.performanceMonitor.startUpdateTiming();

			// Update all systems
			this.update(deltaTime);

			this.performanceMonitor.endUpdateTiming();

			// Render
			this.performanceMonitor.startRenderTiming();
			this.render();
			this.performanceMonitor.endRenderTiming();
		}

		// Update performance stats
		this.performanceMonitor.update(deltaTime);

		// Continue loop
		requestAnimationFrame(this.gameLoop);
	}

	/**
	 * Update all game systems
	 */
	update(deltaTime) {
		// Update input
		this.inputManager.update(deltaTime);

		// Update player
		this.player.update(deltaTime);

		// Update camera based on player
		this.camera.update(this.player);

		// Update world around player
		this.world.update(this.player, deltaTime);

		// Update UI
		this.updateUI();
	}

	/**
	 * Render the game
	 */
	render() {
		// Apply camera transform to world
		this.camera.applyTransform(this.worldElement);

		// Update world rendering
		this.world.render();
	}    /**
     * Update UI with current game state
     */
    updateUI() {
        const playerPos = this.player.getPosition();
        const chunkPos = this.world.getChunkCoordinates(playerPos);
        const worldStats = this.world.getStats();
        
        this.uiManager.update({
            fps: this.performanceMonitor.getFPS(),
            position: playerPos,
            chunk: `${chunkPos.x}, ${chunkPos.z}`,
            blockLookingAt: this.getBlockLookingAt(),
            chunksLoaded: worldStats.chunkCount,
            loadQueue: worldStats.loadQueueSize,
            unloadQueue: worldStats.unloadQueueSize
        });
    }

	/**
	 * Get the block the player is looking at
	 */
	getBlockLookingAt() {
		// This is a placeholder - we'll implement raycasting later
		return 'none';
	}

	/**
	 * Handle block breaking
	 */
	handleBlockBreak(mousePos) {
		// Placeholder for block breaking logic
		console.log('Block break at:', mousePos);
	}

	/**
	 * Handle block placement
	 */
	handleBlockPlace(mousePos) {
		// Placeholder for block placement logic
		console.log('Block place at:', mousePos);
	}

	/**
	 * Pause the game
	 */
	pause() {
		this.isPaused = true;
		console.log('Game paused');
	}

	/**
	 * Resume the game
	 */
	resume() {
		if (this.isPaused) {
			this.isPaused = false;
			this.lastTime = performance.now();
			console.log('Game resumed');
		}
	}

	/**
	 * Handle window resize
	 */
	handleResize() {
		if (this.camera) {
			this.camera.handleResize();
		}
	}

	/**
	 * Handle visibility change
	 */
	handleVisibilityChange() {
		if (document.hidden) {
			this.pause();
		} else {
			this.resume();
		}
	}    /**
     * Show loading screen with progress
     */
    showLoadingScreen() {
        const loadingElement = document.createElement('div');
        loadingElement.id = 'loading-screen';
        loadingElement.className = 'loading-screen';
        loadingElement.innerHTML = `
            <div>Loading Minecraft.js CSS Edition...</div>
            <div id="loading-status">Initializing...</div>
            <div class="loading-progress">
                <div id="loading-progress-bar" class="loading-progress-bar" style="width: 0%"></div>
            </div>
        `;
        
        document.body.appendChild(loadingElement);
        this.loadingElement = loadingElement;
    }

    /**
     * Update loading progress
     */
    updateLoadingProgress(percent) {
        if (this.loadingElement) {
            const progressBar = this.loadingElement.querySelector('#loading-progress-bar');
            const statusElement = this.loadingElement.querySelector('#loading-status');
            
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
            }
            
            if (statusElement) {
                if (percent < 50) {
                    statusElement.textContent = 'Generating world...';
                } else if (percent < 80) {
                    statusElement.textContent = 'Initializing systems...';
                } else if (percent < 95) {
                    statusElement.textContent = 'Starting game...';
                } else {
                    statusElement.textContent = 'Ready!';
                }
            }
        }
    }

	/**
	 * Hide loading screen
	 */
	hideLoadingScreen() {
		const loadingElement = document.getElementById('loading-screen');
		if (loadingElement) {
			loadingElement.remove();
		}
	}

	/**
	 * Get current game state
	 */
	getState() {
		return {
			isRunning: this.isRunning,
			isPaused: this.isPaused,
			fps: this.performanceMonitor ? this.performanceMonitor.getFPS() : 0,
			playerPosition: this.player ? this.player.getPosition() : null,
			chunkCount: this.world ? this.world.getChunkCount() : 0
		};
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		console.log('Disposing game...');

		this.isRunning = false;

		// Remove event listeners
		window.removeEventListener('resize', this.handleResize);
		document.removeEventListener('visibilitychange', this.handleVisibilityChange);

		// Dispose systems
		if (this.world) {
			this.world.dispose();
			this.world = null;
		}

		if (this.player) {
			this.player.dispose();
			this.player = null;
		}

		if (this.camera) {
			this.camera.dispose();
			this.camera = null;
		}

		if (this.inputManager) {
			this.inputManager.dispose();
			this.inputManager = null;
		}

		if (this.uiManager) {
			this.uiManager.dispose();
			this.uiManager = null;
		}

		if (this.performanceMonitor) {
			this.performanceMonitor.dispose();
			this.performanceMonitor = null;
		}

		// Hide loading screen if present
		this.hideLoadingScreen();

		console.log('Game disposed');
	}
}
