// TextureAtlasBuilder.js - Utility to build a texture atlas from multiple images
class TextureAtlasBuilder {
	constructor(gl) {
		this.gl = gl;
	}

async buildAtlas(imageInfos, atlasWidth, atlasHeight, cellWidth, cellHeight) {
    // Validate inputs
    if (!imageInfos || !Array.isArray(imageInfos) || imageInfos.length === 0) {
        throw new Error('imageInfos must be a non-empty array');
    }
    if (atlasWidth <= 0 || atlasHeight <= 0 || cellWidth <= 0 || cellHeight <= 0) {
        throw new Error('Atlas and cell dimensions must be positive');
    }
    
    // imageInfos: [{ url, x, y }] where x/y are cell positions
    // atlasWidth/atlasHeight: in pixels
    // cellWidth/cellHeight: in pixels
    const canvas = document.createElement('canvas');
    canvas.width = atlasWidth;
    canvas.height = atlasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get 2D context');
    }
    
    // Draw each image into its cell
    try {
        for (const info of imageInfos) {
            const img = await this.loadImage(info.url);
            ctx.drawImage(img, info.x * cellWidth, info.y * cellHeight, cellWidth, cellHeight);
        }
    } catch (error) {
        throw new Error(`Failed to load texture atlas: ${error.message}`);
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
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
			img.onload = () => resolve(img);
			img.src = url;
		});
	}
}

export default TextureAtlasBuilder;
