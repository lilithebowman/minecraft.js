import { NoiseGenerator } from '../utils/noise.js';

self.onmessage = async function(e) {
	const { chunkX, chunkZ, scale, amplitude, baseHeight } = e.data;
	const noiseGen = new NoiseGenerator();
	const blocks = [];
	
	// Generate terrain for this chunk
	for (let x = 0; x < 16; x++) {
		for (let z = 0; z < 16; z++) {
			const worldX = (chunkX * 16) + x;
			const worldZ = (chunkZ * 16) + z;
			
			// Generate height using noise
			let height = baseHeight;
			height += noiseGen.noise(worldX/scale, 0, worldZ/scale) * amplitude;
			height = Math.floor(height);

			// Generate column
			for (let y = 0; y < height; y++) {
				let blockType;
				if (y === 0) {
					blockType = 'bedrock';
				} else if (y < height - 4) {
					blockType = 'stone';
				} else if (y < height - 1) {
					blockType = 'dirt';
				} else {
					blockType = 'grass';
				}

				blocks.push({
					x, y, z,
					worldX, worldZ,
					type: blockType
				});
			}
		}
	}

	self.postMessage({ chunkX, chunkZ, blocks });
};