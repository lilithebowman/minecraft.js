import * as THREE from 'three';
import { NoiseGenerator } from './utils/noise.js';

export class Skybox {
    constructor() {
        this.noiseGen = new NoiseGenerator();
        this.textureSize = 1024;
        this.geometry = new THREE.BoxGeometry(1000, 1000, 1000);
        this.materials = this.createSkyboxMaterials();
        this.mesh = new THREE.Mesh(this.geometry, this.materials);
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

    createSkyboxMaterials() {
        const texture = new THREE.CanvasTexture(this.createCloudTexture());
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);

        // Create materials for each face of the skybox
        const materials = [];
        for (let i = 0; i < 6; i++) {
            materials.push(new THREE.MeshBasicMaterial({
                map: texture.clone(),
                side: THREE.BackSide,
                fog: false
            }));
        }

        return materials;
    }

    update(deltaTime) {
        // Slowly rotate the skybox
        this.mesh.rotation.y += deltaTime * 0.00001;
    }
}
