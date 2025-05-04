import { Engine } from './modules.js';
import { debug } from './debug.js';

async function initGame() {
	try {
		debug.log('Starting game initialization...');

		// Create engine
		const engine = new Engine();

		// Wait for engine to fully initialize
		await engine.init();

		// Wait for camera to be ready with timeout
		let attempts = 0;
		const maxAttempts = 10;
		console.log('*****ENGINE*****');
		console.log(engine.player);
		console.log('*****CAMERA*****');
		console.log(engine.player?.getCamera());

		// Final camera check
		if (!engine.player?.getCamera()) {
			throw new Error('Camera failed to initialize after multiple attempts');
		}

		// Ensure camera matrices are updated
		debug.log('Camera initialized successfully');

		// Start game loop only after confirmed camera initialization
		engine.start();

		// Add window event handlers
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
		console.error('Game initialization failed:', error);
		throw error; // Re-throw to show in console
	}
}

// Start the game when the DOM is ready
document.addEventListener('DOMContentLoaded', initGame);