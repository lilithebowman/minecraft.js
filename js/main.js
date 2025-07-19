// The main module for the WebGL renderer

// WebGL Renderer Scaffold
import WebGLRenderer from './WebGLRenderer.js';

// Initialize renderer when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
	window.renderer = new WebGLRenderer();
});