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

// Helper function to create terrain data for a chunk
function createTerrainData() {
	// This is a simplified version - in reality you'd use noise generators
	const blocks = {};

	// Create a simple terrain with a flat surface
	for (let x = 0; x < 16; x++) {
		for (let z = 0; z < 16; z++) {
			// Bedrock at y=0
			blocks[`${x},0,${z}`] = 'BEDROCK';

			// Stone from y=1 to y=60
			for (let y = 1; y < 60; y++) {
				blocks[`${x},${y},${z}`] = 'STONE';
			}

			// Dirt from y=60 to y=63
			for (let y = 60; y < 63; y++) {
				blocks[`${x},${y},${z}`] = 'DIRT';
			}

			// Grass at y=63
			blocks[`${x},63,${z}`] = 'GRASS';
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