// TextureLoader.js - Loads textures for WebGL
class TextureLoader {
	constructor(gl) {
		this.gl = gl;
	}

    async loadTexture(url) {
        const gl = this.gl;
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = url;
        await new Promise((res, rej) => {
            image.onload = res;
            image.onerror = () => rej(new Error(`Failed to load texture: ${url}`));
        });
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
    }
	}
}

export default TextureLoader;
