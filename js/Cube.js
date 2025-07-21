// Cube.js - WebGL Cube class

class Cube {
	class Cube {
		constructor(gl) {
			if (!gl || !(gl instanceof WebGLRenderingContext)) {
				throw new Error('Valid WebGL context required');
			}
			this.gl = gl;
			this.initBuffers();
			this.initShaders();
		}

		// … rest of class …
	}

	initBuffers() {
		const gl = this.gl;
		// Vertex positions for a cube
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			// Front face
			-1, -1, 1,
			1, -1, 1,
			1, 1, 1,
			-1, 1, 1,
			// Back face
			-1, -1, -1,
			-1, 1, -1,
			1, 1, -1,
			1, -1, -1,
		]), gl.STATIC_DRAW);

		// Indices for cube faces
		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
			// Front
			0, 1, 2, 0, 2, 3,
			// Top
			3, 2, 6, 3, 6, 5,
			// Back
			5, 6, 7, 5, 7, 4,
			// Bottom
			4, 7, 1, 4, 1, 0,
			// Right
			1, 7, 6, 1, 6, 2,
			// Left
			4, 0, 3, 4, 3, 5
		]), gl.STATIC_DRAW);
	}

	initShaders() {
		const gl = this.gl;
		// Vertex shader
		const vsSource = `
      attribute vec3 aPosition;
      uniform mat4 uMVP;
      void main() {
        gl_Position = uMVP * vec4(aPosition, 1.0);
      }
    `;
		// Fragment shader
		const fsSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(0.2, 0.7, 0.3, 1.0);
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
		this.uMVP = gl.getUniformLocation(this.program, 'uMVP');
	}

	draw(mvpMatrix) {
		const gl = this.gl;
		gl.useProgram(this.program);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.enableVertexAttribArray(this.aPosition);
		gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);
		gl.uniformMatrix4fv(this.uMVP, false, mvpMatrix);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
	}
}

export default Cube;
