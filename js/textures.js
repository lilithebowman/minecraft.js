export class TextureManager {
    constructor() {
        this.textureSize = 256;
        this.tileSize = 16;
        this.textures = {};
        this.createAtlas();
    }

    createAtlas() {
        // Create canvas for texture atlas
        const canvas = document.createElement('canvas');
        canvas.width = this.textureSize;
        canvas.height = this.textureSize;
        const ctx = canvas.getContext('2d');

        // Create and position all textures in the atlas
        const texturePositions = {
            grass_top:  { x: 0,  y: 0 },
            grass_side: { x: 16, y: 0 },
            dirt:       { x: 32, y: 0 },
            stone:      { x: 48, y: 0 },
            bedrock:    { x: 64, y: 0 }
        };

        // Draw each texture to its position in the atlas
        for (const [name, pos] of Object.entries(texturePositions)) {
            const texture = this[`create${name.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)).join('')}`](ctx);
            ctx.putImageData(texture, pos.x, pos.y);
        }

        // Create Three.js texture from the atlas
        const atlasTexture = new THREE.CanvasTexture(canvas);
        atlasTexture.magFilter = THREE.NearestFilter;
        atlasTexture.minFilter = THREE.NearestFilter;

        // Create materials for each block type
        const uvSize = this.tileSize / this.textureSize;
        this.materials = {
            grass: new THREE.MeshLambertMaterial({
                map: atlasTexture,
                side: THREE.FrontSide
            }),
            dirt: new THREE.MeshLambertMaterial({
                map: atlasTexture.clone(),
                side: THREE.FrontSide
            }),
            stone: new THREE.MeshLambertMaterial({
                map: atlasTexture.clone(),
                side: THREE.FrontSide
            }),
            bedrock: new THREE.MeshLambertMaterial({
                map: atlasTexture.clone(),
                side: THREE.FrontSide
            })
        };

        // Set UV coordinates for each material
        this.materials.grass.map.offset.set(0, 0);
        this.materials.grass.map.repeat.set(uvSize, uvSize);
        this.materials.dirt.map.offset.set(2 * uvSize, 0);
        this.materials.dirt.map.repeat.set(uvSize, uvSize);
        this.materials.stone.map.offset.set(3 * uvSize, 0);
        this.materials.stone.map.repeat.set(uvSize, uvSize);
        this.materials.bedrock.map.offset.set(4 * uvSize, 0);
        this.materials.bedrock.map.repeat.set(uvSize, uvSize);
    }

    getMaterial(blockType) {
        return this.materials[blockType];
    }

    // Keep existing texture creation methods
    createGrassTop(ctx) {
        const tile = ctx.createImageData(16, 16);
        const data = tile.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // Base green color with noise
            data[i] = 100 + Math.random() * 30;     // R
            data[i + 1] = 167 + Math.random() * 30; // G
            data[i + 2] = 40 + Math.random() * 30;  // B
            data[i + 3] = 255;                      // A
        }
        return tile;
    }

    createGrassSide(ctx) {
        const tile = ctx.createImageData(16, 16);
        const data = tile.data;
        
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const i = (y * 16 + x) * 4;
                if (y < 4) {
                    // Top grass part
                    data[i] = 100 + Math.random() * 30;
                    data[i + 1] = 167 + Math.random() * 30;
                    data[i + 2] = 40 + Math.random() * 30;
                } else {
                    // Dirt part
                    data[i] = 150 + Math.random() * 20;
                    data[i + 1] = 106 + Math.random() * 20;
                    data[i + 2] = 47 + Math.random() * 20;
                }
                data[i + 3] = 255;
            }
        }
        return tile;
    }

    createDirt(ctx) {
        const tile = ctx.createImageData(16, 16);
        const data = tile.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 150 + Math.random() * 20;     // R
            data[i + 1] = 106 + Math.random() * 20; // G
            data[i + 2] = 47 + Math.random() * 20;  // B
            data[i + 3] = 255;                      // A
        }
        return tile;
    }

    createStone(ctx) {
        const tile = ctx.createImageData(16, 16);
        const data = tile.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const shade = 128 + Math.random() * 30;
            data[i] = shade;     // R
            data[i + 1] = shade; // G
            data[i + 2] = shade; // B
            data[i + 3] = 255;   // A
        }
        return tile;
    }

    createBedrock(ctx) {
        const tile = ctx.createImageData(16, 16);
        const data = tile.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const shade = 50 + Math.random() * 20;
            data[i] = shade;     // R
            data[i + 1] = shade; // G
            data[i + 2] = shade; // B
            data[i + 3] = 255;   // A
        }
        return tile;
    }
}