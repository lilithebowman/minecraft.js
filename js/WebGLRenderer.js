// WebGL Renderer Scaffold
class WebGLRenderer {
	constructor(canvasId = 'game-canvas') {
		this.canvas = document.getElementById(canvasId);
		if (!this.canvas) {
			// Create canvas if not found
			this.canvas = document.createElement('canvas');
			this.canvas.id = canvasId;
			this.canvas.style.position = 'absolute';
			this.canvas.style.top = '0';
			this.canvas.style.left = '0';
			this.canvas.style.width = '100%';
			this.canvas.style.height = '100%';
			document.body.appendChild(this.canvas);
		}
		this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
		if (!this.gl) {
			throw new Error('WebGL not supported');
		}
		this.resize();
		window.addEventListener('resize', () => this.resize());
		this.init();
		this.animate = this.animate.bind(this);
		requestAnimationFrame(this.animate);
	}

	resize() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	}

	init() {
		// Set clear color to sky blue
		this.gl.clearColor(0.53, 0.81, 0.92, 1.0);
	}

	render() {
		// Clear the color buffer
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		// ...future: draw scene...
	}

	animate() {
		this.render();
		requestAnimationFrame(this.animate);
	}
}

export default WebGLRenderer;
