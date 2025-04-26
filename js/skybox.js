import * as THREE from 'three';
import { NoiseGenerator } from './utils/noise.js';

export class Skybox {
    constructor() {
        this.noiseGen = new NoiseGenerator();
        this.textureSize = 1024;
        // Make the skybox much larger to ensure it encompasses the scene
        this.geometry = new THREE.BoxGeometry(2000, 2000, 2000);
        this.texturePath = 'textures/skybox_clouds.png';
        this.initialize();
    }

    async initialize() {
        try {
            // Try to load existing texture first
            const texture = await this.loadTexture();
            this.materials = this.createSkyboxMaterials(texture);
        } catch (error) {
            // If loading fails, generate and save new texture
            console.log('Generating new skybox texture...');
            const canvas = this.createCloudTexture();
            await this.saveTexture(canvas);
            const texture = new THREE.CanvasTexture(canvas);
            this.materials = this.createSkyboxMaterials(texture);
        }
        this.mesh = new THREE.Mesh(this.geometry, this.materials);
        this.mesh.position.set(0, 0, 0);
    }

    async loadTexture() {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                this.texturePath,
                (texture) => {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(2, 2);
                    resolve(texture);
                },
                undefined,
                reject
            );
        });
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

    createSkyboxMaterials(texture) {
        // Create a single material for all faces
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            fog: false,
            transparent: true,
            opacity: 0.8
        });

        // Return array of 6 references to the same material
        return Array(6).fill(material);
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

    update(deltaTime) {
        // Rotate more noticeably
        this.mesh.rotation.y += deltaTime * 0.0001;
    }
}
