// WebGL Renderer Scaffold
import TextureLoader from './TextureLoader.js';
import Scene from './Scene.js';

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
		this.gl = this.canvas.getContext('webgl');
		if (!this.gl) {
			throw new Error('WebGL not supported');
		}
		this.resize();
		window.addEventListener('resize', () => this.resize());
		this.init();
		this.gl.enable(this.gl.DEPTH_TEST);
		this.animate = this.animate.bind(this);
		this.angleX = 0;
		this.angleY = 0;
		this.angleZ = 0;
		this.scene = null;
		this.textureLoader = new TextureLoader(this.gl);
		this.initScene().then(() => {
			requestAnimationFrame(this.animate);
		}).catch((error) => {
			console.error('Failed to initialize the scene:', error);
			// Optionally, display an error message to the user or take other recovery actions
		});
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

	async initScene() {
		// Load the atlas texture using TextureLoader
		const textureManifest = {
			atlas: 'textures/mc_grass_atlas.png'
		};
		const atlasTexture = await this.textureLoader.loadTexture(textureManifest.atlas);
		// Atlas layout: assumes 3x2 grid (side, top, bottom)
		// Each cell: [u0,v0,u1,v1] (minU,minV,maxU,maxV)
		const cellW = 1 / 3, cellH = 1 / 2;
		const atlasLayout = {
			side: [0, 0, cellW, cellH], // leftmost cell (side)
			top: [cellW, 0, 2 * cellW, cellH], // middle cell (top)
			bottom: [2 * cellW, 0, 1, cellH] // rightmost cell (bottom)
		};
		this.scene = new Scene(this.gl, atlasTexture, atlasLayout);
	}

	render() {
		this.scene.update(this);
		this.scene.draw(this);
	}

	translationMatrix(x, y, z) {
		var out = new Float32Array(16);
		out[0] = 1; out[4] = 0; out[8] = 0; out[12] = x;
		out[1] = 0; out[5] = 1; out[9] = 0; out[13] = y;
		out[2] = 0; out[6] = 0; out[10] = 1; out[14] = z;
		out[3] = 0; out[7] = 0; out[11] = 0; out[15] = 1;
		return out;
	}

	animate() {
		this.angleX += 0.013;
		this.angleY += 0.021;
		this.angleZ += 0.017;
		this.render();
		requestAnimationFrame(this.animate);
	}

	// Matrix helpers
	perspectiveMatrix(fov, aspect, near, far) {
		var f = 1.0 / Math.tan(fov / 2);
		var nf = 1 / (near - far);
		return new Float32Array([
			f / aspect, 0, 0, 0,
			0, f, 0, 0,
			0, 0, (far + near) * nf, -1,
			0, 0, (2 * far * near) * nf, 0
		]);
	}

	lookAtMatrix(eye, center, up) {
		var x0 = eye[0], x1 = eye[1], x2 = eye[2];
		var y0 = center[0], y1 = center[1], y2 = center[2];
		var z0 = up[0], z1 = up[1], z2 = up[2];
		// Forward
		var fx = y0 - x0, fy = y1 - x1, fz = y2 - x2;
		var rlf = 1 / Math.hypot(fx, fy, fz);
		fx *= rlf; fy *= rlf; fz *= rlf;
		// Side
		var sx = fy * z2 - fz * z1, sy = fz * z0 - fx * z2, sz = fx * z1 - fy * z0;
		var rls = 1 / Math.hypot(sx, sy, sz);
		sx *= rls; sy *= rls; sz *= rls;
		// Up
		var ux = sy * fz - sz * fy, uy = sz * fx - sx * fz, uz = sx * fy - sy * fx;
		return new Float32Array([
			sx, ux, -fx, 0,
			sy, uy, -fy, 0,
			sz, uz, -fz, 0,
			0, 0, 0, 1
		]);
	}

	rotationMatrixX(angle) {
		var c = Math.cos(angle), s = Math.sin(angle);
		return new Float32Array([
			1, 0, 0, 0,
			0, c, -s, 0,
			0, s, c, 0,
			0, 0, 0, 1
		]);
	}

	rotationMatrixY(angle) {
		var c = Math.cos(angle), s = Math.sin(angle);
		return new Float32Array([
			c, 0, s, 0,
			0, 1, 0, 0,
			-s, 0, c, 0,
			0, 0, 0, 1
		]);
	}

	rotationMatrixZ(angle) {
		var c = Math.cos(angle), s = Math.sin(angle);
		return new Float32Array([
			c, -s, 0, 0,
			s, c, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]);
	}

	multiplyMatrices(a, b) {
		// Multiplies two 4x4 matrices in column-major order
		var out = new Float32Array(16);
		for (var col = 0; col < 4; ++col) {
			for (var row = 0; row < 4; ++row) {
				out[col * 4 + row] = 0;
				for (var k = 0; k < 4; ++k) {
					out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
				}
			}
		}
		return out;
	}
}

export default WebGLRenderer;
