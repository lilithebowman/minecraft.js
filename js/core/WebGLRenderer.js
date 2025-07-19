// Basic WebGL renderer for Minecraft.js
// Renders cubes and a sphere for the player

class WebGLRenderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.gl = canvas.getContext('webgl');
		if (!this.gl) throw new Error('WebGL not supported');
		this.init();
	}

	init() {
		const gl = this.gl;
		gl.clearColor(0.53, 0.81, 0.92, 1.0); // Sky blue
		gl.enable(gl.DEPTH_TEST);

		// Setup basic shaders for cubes (with texture) and sphere (solid color)
		// For brevity, use hardcoded shaders here
		// Vertex shader for cubes
		this.cubeVS = `
			attribute vec3 position;
			attribute vec2 uv;
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`;
		// Fragment shader for cubes
		this.cubeFS = `
			precision mediump float;
			varying vec2 vUv;
			uniform sampler2D texture;
			void main() {
				gl_FragColor = texture2D(texture, vUv);
			}
		`;
		// Vertex shader for sphere
		this.sphereVS = `
			attribute vec3 position;
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			void main() {
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`;
		// Fragment shader for sphere
		this.sphereFS = `
			precision mediump float;
			uniform vec3 color;
			void main() {
				gl_FragColor = vec4(color, 1.0);
			}
		`;
		// Compile shaders and create programs
		this.initPrograms();
		// Load grass texture
		this.loadTexture('textures/grass.png');
	}
	initPrograms() {
		const gl = this.gl;
		// Compile cube shaders
		this.cubeProgram = this.createProgram(this.cubeVS, this.cubeFS);
		// Compile sphere shaders
		this.sphereProgram = this.createProgram(this.sphereVS, this.sphereFS);
	}

	createProgram(vsSource, fsSource) {
		const gl = this.gl;
		const vs = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vs, vsSource);
		gl.compileShader(vs);
		if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(vs));
		const fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fs, fsSource);
		gl.compileShader(fs);
		if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(fs));
		const program = gl.createProgram();
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
		return program;
	}

	loadTexture(url) {
		const gl = this.gl;
		const texture = gl.createTexture();
		const image = new window.Image();
		image.src = url;
		image.onload = () => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			this.grassTexture = texture;
		};
	}

	clear() {
		const gl = this.gl;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	renderCube(x, y, z, size) {
		// Draw a textured cube at (x, y, z) with given size
		// For brevity, use a hardcoded cube geometry and drawArrays
		const gl = this.gl;
		if (!this.grassTexture) return; // Wait for texture
		gl.useProgram(this.cubeProgram);
		// Setup geometry
		const positions = new Float32Array([
			// Front face
			-size / 2, -size / 2, size / 2,
			size / 2, -size / 2, size / 2,
			size / 2, size / 2, size / 2,
			-size / 2, size / 2, size / 2,
			// Back face
			-size / 2, -size / 2, -size / 2,
			size / 2, -size / 2, -size / 2,
			size / 2, size / 2, -size / 2,
			-size / 2, size / 2, -size / 2,
		]);
		const uvs = new Float32Array([
			// Front
			0, 0, 1, 0, 1, 1, 0, 1,
			// Back
			0, 0, 1, 0, 1, 1, 0, 1,
		]);
		const indices = new Uint16Array([
			0, 1, 2, 2, 3, 0, // front
			4, 5, 6, 6, 7, 4, // back
			3, 2, 6, 6, 7, 3, // top
			0, 1, 5, 5, 4, 0, // bottom
			1, 2, 6, 6, 5, 1, // right
			0, 3, 7, 7, 4, 0  // left
		]);
		// Create buffers
		const posBuf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		const uvBuf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
		gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
		const idxBuf = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
		// Set attributes
		const posLoc = gl.getAttribLocation(this.cubeProgram, 'position');
		gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
		gl.enableVertexAttribArray(posLoc);
		gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
		const uvLoc = gl.getAttribLocation(this.cubeProgram, 'uv');
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
		gl.enableVertexAttribArray(uvLoc);
		gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
		// Set uniforms
		const mvLoc = gl.getUniformLocation(this.cubeProgram, 'modelViewMatrix');
		const prLoc = gl.getUniformLocation(this.cubeProgram, 'projectionMatrix');
		// Simple camera: look from above
		const modelViewMatrix = this.makeModelViewMatrix(x, y, z);
		const projectionMatrix = this.makeProjectionMatrix();
		gl.uniformMatrix4fv(mvLoc, false, modelViewMatrix);
		gl.uniformMatrix4fv(prLoc, false, projectionMatrix);
		// Texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.grassTexture);
		gl.uniform1i(gl.getUniformLocation(this.cubeProgram, 'texture'), 0);
		// Draw
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
	}

	renderPlayerSphere(x, y, z, radius, color) {
		// Draw a solid color sphere at (x, y, z)
		const gl = this.gl;
		gl.useProgram(this.sphereProgram);
		// Generate sphere geometry (low-res)
		const latBands = 12, longBands = 12;
		const positions = [];
		for (let lat = 0; lat <= latBands; lat++) {
			const theta = lat * Math.PI / latBands;
			for (let lon = 0; lon <= longBands; lon++) {
				const phi = lon * 2 * Math.PI / longBands;
				positions.push(
					x + radius * Math.sin(theta) * Math.cos(phi),
					y + radius * Math.cos(theta),
					z + radius * Math.sin(theta) * Math.sin(phi)
				);
			}
		}
		const posBuf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		const posLoc = gl.getAttribLocation(this.sphereProgram, 'position');
		gl.enableVertexAttribArray(posLoc);
		gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
		// Uniforms
		const mvLoc = gl.getUniformLocation(this.sphereProgram, 'modelViewMatrix');
		const prLoc = gl.getUniformLocation(this.sphereProgram, 'projectionMatrix');
		const colorLoc = gl.getUniformLocation(this.sphereProgram, 'color');
		const modelViewMatrix = this.makeModelViewMatrix(0, 0, 0);
		const projectionMatrix = this.makeProjectionMatrix();
		gl.uniformMatrix4fv(mvLoc, false, modelViewMatrix);
		gl.uniformMatrix4fv(prLoc, false, projectionMatrix);
		gl.uniform3fv(colorLoc, color);
		// Draw points (for simplicity)
		gl.drawArrays(gl.POINTS, 0, positions.length / 3);
	}

	renderWorld(blocks, player) {
		this.clear();
		// Draw floor cubes
		for (const block of blocks) {
			this.renderCube(block.x, block.y, block.z, block.size || 1);
		}
		// Draw player sphere
		this.renderPlayerSphere(player.x, player.y, player.z, player.radius, player.color);
	}
	makeModelViewMatrix(x, y, z) {
		// Simple look-at from above
		const out = new Float32Array(16);
		for (let i = 0; i < 16; i++) out[i] = i % 5 == 0 ? 1 : 0;
		out[12] = x;
		out[13] = y;
		out[14] = z;
		return out;
	}
	makeProjectionMatrix() {
		// Simple perspective
		const fov = Math.PI / 4, aspect = this.canvas.width / this.canvas.height, near = 0.1, far = 100;
		const f = 1 / Math.tan(fov / 2);
		const out = new Float32Array(16);
		out[0] = f / aspect; out[5] = f; out[10] = (far + near) / (near - far); out[11] = -1; out[14] = (2 * far * near) / (near - far);
		return out;
	}
}

export default WebGLRenderer;
