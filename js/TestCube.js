// TestCube.js - WebGL Cube with UV mapping for texture atlas

class TestCube {
	constructor(gl, atlasTexture, atlasLayout) {
		// gl: WebGL context
		// atlasTexture: WebGLTexture
		// atlasLayout: { side: [u0,v0,u1,v1], top: [...], bottom: [...] }
		this.gl = gl;
		this.atlasTexture = atlasTexture;
		this.atlasLayout = atlasLayout;
		this.angleX = 0;
		this.angleY = 0;
		this.angleZ = 0;
		this.initBuffers();
		this.initShaders();
	}

	initBuffers() {
		const gl = this.gl;
		// Vertex positions for a cube
		const positions = [
			// Front
			-1, -1, 1,
			1, -1, 1,
			1, 1, 1,
			-1, 1, 1,
			// Back
			-1, -1, -1,
			-1, 1, -1,
			1, 1, -1,
			1, -1, -1,
		];
		// UVs for each face, using atlasLayout
		const s = this.atlasLayout.side;
		const t = this.atlasLayout.top;
		const b = this.atlasLayout.bottom;
		// Each face: 4 vertices, so 6 faces * 4 = 24
		const uvs = [
			// Front (side)
			s[0], s[3], s[2], s[3], s[2], s[1], s[0], s[1],
			// Back (side)
			s[2], s[3], s[2], s[1], s[0], s[1], s[0], s[3],
			// Top
			t[0], t[1], t[2], t[1], t[2], t[3], t[0], t[3],
			// Bottom
			b[0], b[1], b[2], b[1], b[2], b[3], b[0], b[3],
			// Right (side)
			s[0], s[3], s[2], s[3], s[2], s[1], s[0], s[1],
			// Left (side)
			s[2], s[3], s[2], s[1], s[0], s[1], s[0], s[3],
		];
		// Indices for 6 faces
		const indices = [
			0, 1, 2, 0, 2, 3,      // Front
			4, 5, 6, 4, 6, 7,      // Back
			8, 9, 10, 8, 10, 11,      // Top
			12, 13, 14, 12, 14, 15,      // Bottom
			16, 17, 18, 16, 18, 19,      // Right
			20, 21, 22, 20, 22, 23,      // Left
		];
		// Create buffers
		this.positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		   // Front
		   -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
		   // Back
		   -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1,
		   // Top
		   -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1,
		   // Bottom
		   -1, -1, 1, -1, -1, -1, 1, -1, -1, 1, -1, 1,
		   // Right
		   1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1,
		   // Left
		   -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1
		]), gl.STATIC_DRAW);
		this.uvBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	}

	initShaders() {
		const gl = this.gl;
		// Vertex shader
		const vsSource = `
	  attribute vec3 aPosition;
	  attribute vec2 aUV;
	  uniform mat4 uMVP;
	  varying vec2 vUV;
	  void main() {
		vUV = aUV;
		gl_Position = uMVP * vec4(aPosition, 1.0);
	  }
	`;
		// Fragment shader
		const fsSource = `
	  precision mediump float;
	  varying vec2 vUV;
	  uniform sampler2D uTexture;
	  void main() {
		gl_FragColor = texture2D(uTexture, vUV);
	  }
	`;
		// Compile shaders
		const vs = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vs, vsSource);
		gl.compileShader(vs);
		const fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fs, fsSource);
		gl.compileShader(fs);
		// Link program
		this.program = gl.createProgram();
		gl.attachShader(this.program, vs);
		gl.attachShader(this.program, fs);
		gl.linkProgram(this.program);
		// Get attribute/uniform locations
		this.aPosition = gl.getAttribLocation(this.program, 'aPosition');
		this.aUV = gl.getAttribLocation(this.program, 'aUV');
		this.uMVP = gl.getUniformLocation(this.program, 'uMVP');
		this.uTexture = gl.getUniformLocation(this.program, 'uTexture');
	}

	update() {
		this.angleX += 0.013;
		this.angleY += 0.021;
		this.angleZ += 0.017;
	}

	getModelMatrix(renderer) {
		// Compose rotation matrices for all 3 axes
		var rotX = renderer.rotationMatrixX(this.angleX);
		var rotY = renderer.rotationMatrixY(this.angleY);
		var rotZ = renderer.rotationMatrixZ(this.angleZ);
		var rotation = renderer.multiplyMatrices(rotZ, renderer.multiplyMatrices(rotY, rotX));
		var translation = renderer.translationMatrix(0, 1, -10);
		return renderer.multiplyMatrices(translation, rotation);
	}

	draw(mvpMatrix) {
		const gl = this.gl;
		gl.useProgram(this.program);
		// Position
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.enableVertexAttribArray(this.aPosition);
		gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);
		// UV
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		gl.enableVertexAttribArray(this.aUV);
		gl.vertexAttribPointer(this.aUV, 2, gl.FLOAT, false, 0, 0);
		// MVP
		gl.uniformMatrix4fv(this.uMVP, false, mvpMatrix);
		// Texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
		gl.uniform1i(this.uTexture, 0);
		// Indices
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
	}
}

export default TestCube;
