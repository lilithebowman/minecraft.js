import { Engine } from './modules.js';
import { debug } from './debug.js';

async function initGame() {
	try {
		debug.log('Starting game initialization...');

		// Create engine
		const engine = new Engine();

		// Wait for engine to fully initialize
		await engine.init();

		// Ensure camera is ready before starting render loop
		if (!engine.player?.camera) {
			throw new Error('Camera not initialized');
		}

		// Start game loop only after initialization
		engine.start();

		// Add window event handlers after successful init
		window.addEventListener('resize', () => {
			engine.player?.handleResize();
			engine.renderer?.handleResize();
		});

		// Handle cleanup on page unload
		window.addEventListener('beforeunload', () => {
			engine.dispose();
		});

		debug.log('Game initialized successfully');

	} catch (error) {
		debug.log('Failed to initialize game:', error);
		console.error('Game initialization failed:', error);
	}
}

// Start the game when the DOM is ready
document.addEventListener('DOMContentLoaded', initGame);