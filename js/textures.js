import * as THREE from 'three';
import { NoiseGenerator } from './utils/noise.js';

export class TextureManager {
	constructor() {
		this.textureSize = 64;
		this.tileSize = 16;
		// Initialize as Map instead of plain object
		this.textures = new Map();
		this.noiseGen = new NoiseGenerator();
		this.initialized = false;
	}

	async initialize() {
		if (this.initialized) return this;

		const grassImageCanvas = await this.loadOrCreateTexture('grass', this.createGrassTop.bind(this));
		const dirtImageCanvas = await this.loadOrCreateTexture('dirt', this.createDirt.bind(this));
		const stoneImageCanvas = await this.loadOrCreateTexture('stone', this.createStone.bind(this));
		const bedrockImageCanvas = await this.loadOrCreateTexture('bedrock', this.createBedrock.bind(this));

		this.textures.set('grass', grassImageCanvas);
		this.textures.set('dirt', dirtImageCanvas);
		this.textures.set('stone', stoneImageCanvas);
		this.textures.set('bedrock', bedrockImageCanvas);

		// Initialize texture atlas
		console.log('Initializing texture manager...');
		const atlas = await this.createAtlas([
			{ name: 'grass', img: await this.loadOrCreateTexture('grass', this.createGrassTop.bind(this)) },
			{ name: 'dirt', img: await this.loadOrCreateTexture('dirt', this.createDirt.bind(this)) },
			{ name: 'stone', img: await this.loadOrCreateTexture('stone', this.createStone.bind(this)) },
			{ name: 'bedrock', img: await this.loadOrCreateTexture('bedrock', this.createBedrock.bind(this)) },
		]);
		try {
			const atlas = await this.createAtlas();
			this.textures.set('atlas', atlas);
			this.initialized = true;
			console.log('Texture atlas created successfully');
		} catch (error) {
			console.error('Failed to initialize texture manager:', error);
			throw error;
		}

		this.createDebugDisplay();

		return this;
	}

	// Create a debug display showing the individual textures all in a row at the bottom of the screen
	createDebugDisplay() {
		const debugCanvas = document.createElement('canvas');
		debugCanvas.width = this.textureSize * 4;
		debugCanvas.height = this.textureSize;
		debugCanvas.style.position = 'absolute';
		debugCanvas.style.bottom = '0';
		debugCanvas.style.left = '0';
		debugCanvas.style.zIndex = '9999';
		debugCanvas.style.pointerEvents = 'none';
		debugCanvas.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		debugCanvas.style.border = '1px solid white';
		debugCanvas.style.borderRadius = '5px';
		debugCanvas.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
		debugCanvas.style.fontFamily = 'monospace';
		const ctx = debugCanvas.getContext('2d');

		let xOffset = 0;
		for (const [name, texture] of this.textures) {
			if (texture instanceof HTMLImageElement) {
				ctx.drawImage(texture, xOffset, 0, this.textureSize, this.textureSize);
				xOffset += this.textureSize;
			}
		}

		document.body.appendChild(debugCanvas);
	}

	getMaterial(textureName) {
		if (!this.initialized) {
			console.warn('Texture atlas not loaded - call initialize() first');
			return new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Magenta fallback
		}

		// Create a new material NOT using the texture atlas
		const material = new THREE.MeshStandardMaterial({
			map: new THREE.Texture(this.textures.get(textureName)),
			color: 0xff00ff, // Magenta fallback
			roughness: 0.3,
			metalness: 0.9
		});

		// Calculate UV coordinates based on texture position in atlas
		const textureIndex = {
			'grass': 0,
			'dirt': 1,
			'stone': 2,
			'bedrock': 3
		}[textureName];

		if (textureIndex === undefined) {
			console.error('Unknown texture:', textureName);
			return material;
		}

		// Calculate UV coordinates
		const textureCount = 4; // Total number of textures in atlas
		const tileSize = this.tileSize;
		const atlasWidth = tileSize * 4; // Assuming 4 textures in a row
		const atlasHeight = tileSize;
		if (atlasWidth <= 0 || atlasHeight <= 0) {
			console.error('Invalid atlas dimensions:', atlasWidth, atlasHeight);
			return material;
		}

		// Calculate UV offset based on texture position
		const startX = (atlasWidth - (textureCount * tileSize)) / 2;
		const x = (startX + (textureIndex * tileSize)) / atlasWidth;
		const y = (atlasHeight - tileSize) / (2 * atlasHeight);

		// Set UV transformation
		material.map.offset.set(x, y);
		material.map.repeat.set(tileSize / atlasWidth, tileSize / atlasHeight);
		material.needsUpdate = true;

		return material;
	}

	async loadOrCreateTexture(name, createFunc) {
		// Try to load from server first
		try {
			const response = await fetch(`textures/${name}.png`);
			if (response.ok) {
				const blob = await response.blob();
				const img = new Image();
				img.src = URL.createObjectURL(blob);
				return new Promise((resolve) => {
					img.onload = () => resolve(img);
				});
			}
		} catch (err) {
			console.warn('Failed to load texture from server:', err);
		}

		// Create new texture
		const canvas = document.createElement('canvas');
		canvas.width = this.tileSize;
		canvas.height = this.tileSize;
		const ctx = canvas.getContext('2d');
		const imageData = createFunc(ctx);
		ctx.putImageData(imageData, 0, 0);

		// Save to server
		try {
			const dataURL = canvas.toDataURL('image/png');
			const response = await fetch('saveTexture.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: name,
					data: dataURL
				})
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const result = await response.json();
			if (!result.success) {
				throw new Error(result.error || 'Failed to save texture');
			}
		} catch (err) {
			console.warn('Unable to save texture to server:', err);
		}

		return canvas;
	}

	createGrassTop(ctx = document.createElement('canvas').getContext('2d')) {
		const tile = ctx.createImageData(64, 64);
		const data = tile.data;

		for (let y = 0; y < 64; y++) {
			for (let x = 0; x < 64; x++) {
				const i = (y * 64 + x) * 4;
				const noise = this.noiseGen.noise(x / 8, y / 8, 0) * 0.5 + 0.5;
				// Minecraft grass green colors
				data[i] = 89 + noise * 35;     // R (darker green)
				data[i + 1] = 145 + noise * 45; // G (brighter green)
				data[i + 2] = 50 + noise * 25;  // B (slight blue tint)
				data[i + 3] = 255;              // A
			}
		}
		return tile;
	}

	createDirt(ctx = document.createElement('canvas').getContext('2d')) {
		const tile = ctx.createImageData(64, 64);
		const data = tile.data;

		for (let y = 0; y < 64; y++) {
			for (let x = 0; x < 64; x++) {
				const i = (y * 64 + x) * 4;
				const noise = this.noiseGen.noise(x / 6, y / 6, 0) * 0.5 + 0.5;
				// Minecraft dirt brown colors
				data[i] = 134 + noise * 25;     // R
				data[i + 1] = 96 + noise * 20;  // G
				data[i + 2] = 67 + noise * 15;  // B
				data[i + 3] = 255;              // A
			}
		}
		return tile;
	}

	createStone(ctx = document.createElement('canvas').getContext('2d')) {
		const tile = ctx.createImageData(64, 64);
		const data = tile.data;

		for (let y = 0; y < 64; y++) {
			for (let x = 0; x < 64; x++) {
				const i = (y * 64 + x) * 4;
				const noise = this.noiseGen.noise(x / 4, y / 4, 0) * 0.5 + 0.5;
				// Minecraft stone grey colors
				const shade = 128 + noise * 25;
				data[i] = shade;     // R
				data[i + 1] = shade; // G
				data[i + 2] = shade; // B
				data[i + 3] = 255;   // A
			}
		}
		return tile;
	}

	createBedrock(ctx = document.createElement('canvas').getContext('2d')) {
		const tile = ctx.createImageData(64, 64);
		const data = tile.data;

		for (let y = 0; y < 64; y++) {
			for (let x = 0; x < 64; x++) {
				const i = (y * 64 + x) * 4;
				const noise = this.noiseGen.noise(x / 3, y / 3, 0) * 0.5 + 0.5;
				// Minecraft bedrock dark colors
				const shade = 35 + noise * 20;
				data[i] = shade;     // R
				data[i + 1] = shade; // G
				data[i + 2] = shade; // B
				data[i + 3] = 255;   // A
			}
		}
		return tile;
	}

	async createAtlas() {
		// Define textures to create
		const textures = [
			{ name: 'grass_top', func: this.createGrassTop.bind(this) },
			{ name: 'dirt', func: this.createDirt.bind(this) },
			{ name: 'stone', func: this.createStone.bind(this) },
			{ name: 'bedrock', func: this.createBedrock.bind(this) }
		];

		// Create Three.js texture
		const texture = new THREE.Texture();
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		this.textures.set('atlas', texture);

		return texture;
	}

	dispose() {
		try {
			// Dispose of all loaded textures
			for (const [key, texture] of this.textures) {
				if (texture && typeof texture.dispose === 'function') {
					texture.dispose();
				}
			}

			// Clear all references
			this.textures.clear();
			this.textureAtlas = null;
			this.textureCoordinates = {};
			this.initialized = false;

			console.log('TextureManager disposed successfully');
		} catch (error) {
			console.error('Error disposing TextureManager:', error);
		}
	}
}
