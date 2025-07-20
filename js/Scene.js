// Scene.js - Manages scene objects
import TestCube from './TestCube.js';

class Scene {
	constructor(gl, atlasTexture, atlasLayout) {
		this.gl = gl;
		this.cube = new TestCube(gl, atlasTexture, atlasLayout);
	}

	update(renderer) {
		if (this.cube) {
			this.cube.update();
		}
	}

	draw(renderer) {
		if (this.cube) {
			const modelMatrix = this.cube.getModelMatrix(renderer);
			var fov = Math.PI / 3;
			var aspect = renderer.canvas.width / renderer.canvas.height;
			var near = 0.1;
			var far = 100;
			var perspective = renderer.perspectiveMatrix(fov, aspect, near, far);
			var view = renderer.lookAtMatrix([0, 0, 5], [0, 0, 0], [0, 1, 0]);
			var mvp = renderer.multiplyMatrices(perspective, renderer.multiplyMatrices(view, modelMatrix));
			this.cube.draw(mvp);
		}
	}
}

export default Scene;
