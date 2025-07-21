// buildGrass.js - Script to generate a grass block atlas
import TextureAtlasBuilder from './TextureAtlasBuilder.js';

/**
 * Assembles and returns a WebGL texture atlas for a grass block using a 3x2 grid of 64x64 pixel cells.
 *
 * The atlas combines grass side, top, and bottom textures into a single image for efficient rendering.
 * @returns {Promise<WebGLTexture>} A promise that resolves to the generated atlas texture.
 */
async function buildGrassAtlas(gl) {
	// 3x2 grid: [side, top, bottom]
	// left, right, front, back: mc_grass_side.png
	// top: mc_grass_top.png
	// bottom: mc_grass_bottom.png
	const cellSize = 64; // pixels per cell (adjust as needed)
	const atlasWidth = 3 * cellSize;
	const atlasHeight = 2 * cellSize;
	const imageInfos = [
		// Row 0
		{ url: 'textures/mc_grass_side.png', x: 0, y: 0 }, // left/front/back/right
		{ url: 'textures/mc_grass_top.png', x: 1, y: 0 },  // top
		{ url: 'textures/mc_grass_bottom.png', x: 2, y: 0 }, // bottom
		// Row 1 (repeat side for completeness, not used by TestCube)
		{ url: 'textures/mc_grass_side.png', x: 0, y: 1 },
		{ url: 'textures/mc_grass_side.png', x: 1, y: 1 },
		{ url: 'textures/mc_grass_side.png', x: 2, y: 1 }
	];
	const builder = new TextureAtlasBuilder(gl);
	const atlasTexture = await builder.buildAtlas(imageInfos, atlasWidth, atlasHeight, cellSize, cellSize);
	// Optionally: save the atlas to disk (not possible in browser, but you can export the canvas)
	// Return atlasTexture for use in WebGL
	return atlasTexture;
}

export default buildGrassAtlas;
