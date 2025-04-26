import * as THREE from 'three';
import { NoiseGenerator } from './utils/noise.js';

export class Skybox {
    constructor() {
        this.noiseGen = new NoiseGenerator();
        this.textureSize = 1024;
        this.initialize();
    }

    async initialize() {
        try {
            let texture;
            
            // Try to load existing texture first
            try {
                texture = await this.loadExistingTexture();
                console.log('Loaded existing skybox texture');
            } catch (error) {
                console.log('No existing texture found, generating new one...');
                const canvas = this.createCloudTexture();
                texture = new THREE.CanvasTexture(canvas);
                
                // Save the newly generated texture
                await this.saveTexture(canvas);
            }

            texture.needsUpdate = true;
            
            // Create the background material using the texture
            this.material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide
            });

        } catch (error) {
            console.error('Failed to initialize skybox:', error);
            throw error;
        }
    }

    update(scene) {
        if (!scene.background) {
            scene.background = this.material;
        }
    }

    createCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = this.textureSize;
        canvas.height = this.textureSize;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(this.textureSize, this.textureSize);
        const data = imageData.data;

        // Generate cloud pattern using 3D Perlin noise
        for (let y = 0; y < this.textureSize; y++) {
            for (let x = 0; x < this.textureSize; x++) {
                const i = (y * this.textureSize + x) * 4;
                
                // Sample noise at different frequencies
                const scale1 = 8;
                const scale2 = 16;
                const scale3 = 32;
                
                const noise1 = this.noiseGen.noise(x/scale1, y/scale1, 0) * 0.5;
                const noise2 = this.noiseGen.noise(x/scale2, y/scale2, 0.5) * 0.3;
                const noise3 = this.noiseGen.noise(x/scale3, y/scale3, 1.0) * 0.2;
                
                const cloud = (noise1 + noise2 + noise3) * 255;
                
                // Sky blue color (135, 206, 235)
                data[i] = 135;     // R
                data[i + 1] = 206; // G
                data[i + 2] = 235; // B
                
                // Add clouds
                const cloudIntensity = Math.max(0, Math.min(255, cloud));
                data[i] = Math.min(255, data[i] + cloudIntensity);
                data[i + 1] = Math.min(255, data[i + 1] + cloudIntensity);
                data[i + 2] = Math.min(255, data[i + 2] + cloudIntensity);
                data[i + 3] = 255; // A
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    async saveTexture(canvas) {
        try {
            // Convert canvas to base64 data URL
            const dataURL = canvas.toDataURL('image/png');
            
            // Prepare JSON payload
            const payload = {
                name: 'skybox_clouds',
                data: dataURL
            };

            // Send to PHP script
            const response = await fetch('saveTexture.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }
            
            console.log('Skybox texture saved successfully:', result);
            return result;
        } catch (error) {
            console.error('Failed to save skybox texture:', error);
            throw error;
        }
    }

    async loadExistingTexture() {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                'textures/skybox_clouds.png',
                (texture) => resolve(texture),
                undefined,
                (error) => reject(error)
            );
        });
    }
}
