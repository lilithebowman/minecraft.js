// The main module for the WebGL renderer

// WebGL Renderer Scaffold
import WebGLRenderer from './WebGLRenderer.js';

// Initialize renderer when DOM is ready
let renderer = null;

window.addEventListener('DOMContentLoaded', () => {
	try {
		renderer = new WebGLRenderer();
		// Store reference if needed for debugging, but avoid global scope
		if (window.DEBUG_MODE) {
			window.__debugRenderer = renderer;
		}
	} catch (error) {
		console.error('Failed to initialize WebGL renderer:', error);
		// Display user-friendly error message
		document.body.innerHTML = '<div class="error">WebGL is not supported or failed to initialize. Please use a modern browser.</div>';
	}
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
	if (renderer && renderer.destroy) {
		renderer.destroy();
	}
});