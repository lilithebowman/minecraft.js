class TextureManager {
    constructor() { ... }

    async initialize() { ... }

    getMaterial(textureName) { ... }

    async loadOrCreateTexture(name, createFunc) { ... }

    createGrassTop(ctx) {
        const canvas = document.createElement('canvas');
        canvas.width = 64; // Set width to 64
        canvas.height = 64; // Set height to 64
        ctx = canvas.getContext('2d');

        // Example drawing logic (adjust as needed for 64x64)
        ctx.fillStyle = '#6abf69';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#5cae5c';
        ctx.fillRect(0, 0, 64, 16);


        return canvas;
    }

    createDirt(ctx) {
        const canvas = document.createElement('canvas');
        canvas.width = 64; // Set width to 64
        canvas.height = 64; // Set height to 64
        ctx = canvas.getContext('2d');

        // Example drawing logic (adjust as needed for 64x64)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(0, 0, 64, 64);


        return canvas;
    }

    createStone(ctx) {
        const canvas = document.createElement('canvas');
        canvas.width = 64; // Set width to 64
        canvas.height = 64; // Set height to 64
        ctx = canvas.getContext('2d');

        // Example drawing logic (adjust as needed for 64x64)
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 64, 64);


        return canvas;
    }

    createBedrock(ctx) {
        const canvas = document.createElement('canvas');
        canvas.width = 64; // Set width to 64
        canvas.height = 64; // Set height to 64
        ctx = canvas.getContext('2d');

        // Example drawing logic (adjust as needed for 64x64)
        ctx.fillStyle = '#222222';
        ctx.fillRect(0, 0, 64, 64);


        return canvas;
    }

    async createAtlas() { ... }
}
