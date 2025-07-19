// Minimal scene setup for WebGLRenderer
// Only: player as red sphere, floor of cubes with grass texture

export function getMinimalScene() {
	// Floor: 10x10 cubes at y=0
	const floorBlocks = [];
	const size = 1;
	const N = 10;
	for (let x = -N / 2; x < N / 2; x++) {
		for (let z = -N / 2; z < N / 2; z++) {
			floorBlocks.push({
				x,
				y: 0,
				z,
				type: 'grass',
				size,
				texture: 'textures/grass.png'
			});
		}
	}
	// Player: sphere at center above floor
	const player = {
		x: 0,
		y: 1.5,
		z: 0,
		radius: 0.5,
		color: [1, 0, 0]
	};
	return { blocks: floorBlocks, player };
}
