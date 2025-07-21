const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 22222;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '.')));

// Ensure chunks directory exists
const chunksDir = path.join(__dirname, 'cache', 'chunks');
fs.ensureDirSync(chunksDir);

// API endpoint to load all chunks
app.get('/api/chunks', async (req, res) => {
	try {
		const files = (await fs.promises.readdir(chunksDir)).filter(file => file.startsWith('chunk-') && file.endsWith('.json'));

		const chunks = await Promise.all(files.map(async file => {
			const filePath = path.join(chunksDir, file);
			const content = await fs.promises.readFile(filePath, 'utf8');
			return JSON.parse(content);
		}));

		res.json(chunks);
	} catch (error) {
		console.error('Error loading chunks:', error);
		res.status(500).json({ error: 'Failed to load chunks' });
	}
});

// API endpoint to save a chunk
app.post('/api/chunks/save', async (req, res) => {
	try {
		const { x, z, blocks } = req.body;

		if (x === undefined || z === undefined || !blocks) {
			return res.status(400).json({ error: 'Invalid chunk data' });
		}

		const filePath = path.join(chunksDir, `chunk-${x}-${z}.json`);
		await fs.writeFile(filePath, JSON.stringify(req.body));

		res.json({ success: true });
	} catch (error) {
		console.error('Error saving chunk:', error);
		res.status(500).json({ error: 'Failed to save chunk' });
	}
});

// Generate terrain endpoint
app.post('/api/generateTerrain', async (req, res) => {
	try {
		const { renderDistance = 8 } = req.body;

		// Clear existing chunks
		await fs.emptyDir(chunksDir);

		// Generate new chunks
		for (let x = -renderDistance; x < renderDistance; x++) {
			for (let z = -renderDistance; z < renderDistance; z++) {
				const blocks = createTerrainData();

				const chunkData = {
					x,
					z,
					blocks
				};

				const filePath = path.join(chunksDir, `chunk-${x}-${z}.json`);
				fs.writeFileSync(filePath, JSON.stringify(chunkData));
			}
		}

		res.json({ success: true, chunksGenerated: renderDistance * renderDistance * 4 });
	} catch (error) {
		console.error('Error generating terrain:', error);
		res.status(500).json({ error: 'Failed to generate terrain' });
	}
});

/**
 * Generates a flat Minecraft-like terrain chunk with layered bedrock, stone, dirt, and grass blocks.
 * @return {Object} An object mapping `"x,y,z"` coordinate strings to block type strings for a 16x16x64 chunk.
 */
function createTerrainData() {
	// This is a simplified version - in reality you'd use noise generators
	const blocks = {};

	// Create a simple terrain with guaranteed bedrock bottom
	for (let x = 0; x < 16; x++) {
		for (let z = 0; z < 16; z++) {
			// Bedrock layers at the bottom (y=0 to y=4) - unbreakable foundation
			for (let y = 0; y <= 4; y++) {
				// Higher chance of bedrock at lower levels
				const bedrockChance = y === 0 ? 1.0 : Math.max(0.1, 1.0 - (y * 0.2));
				const blockType = Math.random() < bedrockChance ? 'bedrock' : 'stone';
				blocks[`${x},${y},${z}`] = blockType;
			}

			// Stone from y=5 to y=60
			for (let y = 5; y < 60; y++) {
				blocks[`${x},${y},${z}`] = 'stone';
			}

			// Dirt from y=60 to y=63
			for (let y = 60; y < 63; y++) {
				blocks[`${x},${y},${z}`] = 'dirt';
			}

			// Grass at y=63
			blocks[`${x},63,${z}`] = 'grass';
		}
	}

	return blocks;
}

// Catch-all route to serve the game
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
	console.log(`Minecraft.js server running at http://localhost:${PORT}`);
});