// TextureAtlasBuilder.js - Utility to build a texture atlas from multiple images
class TextureAtlasBuilder {
	constructor(gl) {
		this.gl = gl;
	}

	async buildAtlas(imageInfos, atlasWidth, atlasHeight, cellWidth, cellHeight) {
		// imageInfos: [{ url, x, y }] where x/y are cell positions
		// atlasWidth/atlasHeight: in pixels
		// cellWidth/cellHeight: in pixels
		const canvas = document.createElement('canvas');
		canvas.width = atlasWidth;
		canvas.height = atlasHeight;
		const ctx = canvas.getContext('2d');
		// Draw each image into its cell
		for (const info of imageInfos) {
			const img = await this.loadImage(info.url);
			ctx.drawImage(img, info.x * cellWidth, info.y * cellHeight, cellWidth, cellHeight);
		}
		// Upload to WebGL
		const gl = this.gl;
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		return texture;
	}

	loadImage(url) {
		return new Promise((resolve) => {
			const img = new Image();
			img.src = url;
			img.onload = () => resolve(img);
		});
	}
}

export default TextureAtlasBuilder;
