import * as THREE from 'three';
import { NoiseGenerator } from './utils/noise.js';

export class TextureManager {
    constructor() {
        this.textureSize = 256;
        this.tileSize = 16;
        this.textures = {};
        this.noiseGen = new NoiseGenerator();
        this.createAtlas();
    }

    async loadOrCreateTexture(name, createFunc) {
        // Try to load from localStorage first
        const stored = localStorage.getItem(`texture_${name}`);
        if (stored) {
            const img = new Image();
            img.src = stored;
            return new Promise((resolve) => {
                img.onload = () => resolve(img);
            });
        }

        // Create new texture
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        const imageData = createFunc(ctx);
        ctx.putImageData(imageData, 0, 0);

        // Save to localStorage
        try {
            const dataURL = canvas.toDataURL('image/png');
            localStorage.setItem(`texture_${name}`, dataURL);
        } catch (err) {
            console.warn('Unable to cache texture:', err);
        }

        return canvas;
    }

    createGrassTop(ctx) {
        const tile = ctx.createImageData(16, 16);
        const data = tile.data;
        
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const i = (y * 16 + x) * 4;
                const noise = this.noiseGen.noise(x/8, y/8, 0) * 0.5 + 0.5;
                // Minecraft grass green colors
                data[i] = 89 + noise * 35;     // R (darker green)
                data[i + 1] = 145 + noise * 45; // G (brighter green)
                data[i + 2] = 50 + noise * 25;  // B (slight blue tint)
                data[i + 3] = 255;              // A
            }
        }
        return tile;
    }

    createDirt(ctx) {
        const tile = ctx.createImageData(16, 16);
        const data = tile.data;
        
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const i = (y * 16 + x) * 4;
                const noise = this.noiseGen.noise(x/6, y/6, 0) * 0.5 + 0.5;
                // Minecraft dirt brown colors
                data[i] = 134 + noise * 25;     // R
                data[i + 1] = 96 + noise * 20;  // G
                data[i + 2] = 67 + noise * 15;  // B
                data[i + 3] = 255;              // A
            }
        }
        return tile;
    }

    createStone(ctx) {
        const tile = ctx.createImageData(16, 16);
        const data = tile.data;
        
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const i = (y * 16 + x) * 4;
                const noise = this.noiseGen.noise(x/4, y/4, 0) * 0.5 + 0.5;
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

    createBedrock(ctx) {
        const tile = ctx.createImageData(16, 16);
        const data = tile.data;
        
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const i = (y * 16 + x) * 4;
                const noise = this.noiseGen.noise(x/3, y/3, 0) * 0.5 + 0.5;
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
        // Create canvas for the texture atlas
        const canvas = document.createElement('canvas');
        canvas.width = this.textureSize;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Define textures to create
        const textures = [
            { name: 'grass_top', func: this.createGrassTop.bind(this) },
            { name: 'dirt', func: this.createDirt.bind(this) },
            { name: 'stone', func: this.createStone.bind(this) },
            { name: 'bedrock', func: this.createBedrock.bind(this) }
        ];

        // Calculate starting x position to center textures
        const totalWidth = textures.length * this.tileSize;
        const startX = (this.textureSize - totalWidth) / 2;

        // Create and position each texture
        for (let i = 0; i < textures.length; i++) {
            const texture = textures[i];
            const tileCanvas = await this.loadOrCreateTexture(texture.name, texture.func);
            ctx.drawImage(
                tileCanvas,
                startX + (i * this.tileSize),
                (64 - this.tileSize) / 2,
                this.tileSize,
                this.tileSize
            );
        }

        // Create Three.js texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        this.textures.atlas = texture;

        // Debug view
        canvas.style.position = 'fixed';
        canvas.style.bottom = '0';
        canvas.style.left = '50%';
        canvas.style.transform = 'translateX(-50%)';
        canvas.style.border = '1px solid white';
        document.body.appendChild(canvas);

        return texture;
    }

    getMaterial(textureName) {
        if (!this.textures.atlas) {
            console.error('Texture atlas not loaded');
            return new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Purple fallback
        }

        // Create a new material using the texture atlas
        const material = new THREE.MeshStandardMaterial({
            map: this.textures.atlas,
            roughness: 1.0,
            metalness: 0.0
        });

        // Calculate UV coordinates based on texture position in atlas
        const textureIndex = {
            'grass_top': 0,
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
        const atlasWidth = this.textureSize;
        const atlasHeight = 64;

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
}
