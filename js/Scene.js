// Scene.js - Manages scene objects
import TestCube from './TestCube.js';

class Scene {
	constructor(gl, atlasTexture, atlasLayout) {
		this.gl = gl;
		this.cube = new TestCube(gl, atlasTexture, atlasLayout);
	}

	draw(mvpMatrix) {
		if (this.cube) {
			this.cube.draw(mvpMatrix);
		}
	}
}

export default Scene;
