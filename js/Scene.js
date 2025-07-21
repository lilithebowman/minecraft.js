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
// replace per-frame setup of static matrices with cached versions
const perspective = renderer.cachedPerspective();
const view        = renderer.cachedView();
var mvp = renderer.multiplyMatrices(
  perspective,
  renderer.multiplyMatrices(view, modelMatrix)
);
this.cube.draw(mvp);
		}
	}
}

export default Scene;
