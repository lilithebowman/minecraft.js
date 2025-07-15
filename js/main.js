import { Game } from './core/Game.js';

/**
 * Main entry point for the Minecraft.js CSS Edition
 */
class MinecraftApp {
	constructor() {
		this.game = null;
		this.isInitialized = false;
	}

	/**
	 * Initialize the application
	 */
	async init() {
		if (this.isInitialized) return;

		try {
			console.log('Initializing Minecraft.js CSS Edition...');

			// Create game instance
			this.game = new Game();

			// Start the game
			await this.game.start();

			// Set up global error handling
			this.setupErrorHandling();

			// Make game available globally for debugging
			window.game = this.game;

			this.isInitialized = true;
			console.log('Minecraft.js CSS Edition initialized successfully!');

		} catch (error) {
			console.error('Failed to initialize Minecraft.js:', error);
			this.showError('Failed to initialize game. Please refresh the page.');
		}
	}

	/**
	 * Set up global error handling
	 */
	setupErrorHandling() {
		window.addEventListener('error', (event) => {
			console.error('Global error:', event.error);
			this.showError('An error occurred. Check the console for details.');
		});

		window.addEventListener('unhandledrejection', (event) => {
			console.error('Unhandled promise rejection:', event.reason);
			this.showError('An unexpected error occurred.');
		});
	}

	/**
	 * Show error message to user
	 */
	showError(message) {
		const errorElement = document.createElement('div');
		errorElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 16px;
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        `;
		errorElement.textContent = message;
		document.body.appendChild(errorElement);

		// Remove error after 5 seconds
		setTimeout(() => {
			if (errorElement.parentNode) {
				errorElement.parentNode.removeChild(errorElement);
			}
		}, 5000);
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		if (this.game) {
			this.game.dispose();
			this.game = null;
		}
		this.isInitialized = false;
	}
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	const app = new MinecraftApp();
	app.init();

	// Make app available globally
	window.app = app;

	// Handle page unload
	window.addEventListener('beforeunload', () => {
		app.dispose();
	});
});

// Handle visibility change for performance
document.addEventListener('visibilitychange', () => {
	if (window.game) {
		if (document.hidden) {
			window.game.pause();
		} else {
			window.game.resume();
		}
	}
});