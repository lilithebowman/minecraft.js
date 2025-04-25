export class BlockManager {
    constructor() {
        this.blocks = new Map();
        this.createDisplay();
    }

    createDisplay() {
        this.display = document.createElement('div');
        this.display.style.position = 'fixed';
        this.display.style.top = '30px';  // Position below framerate counter
        this.display.style.right = '10px';
        this.display.style.color = 'white';
        this.display.style.fontFamily = 'monospace';
        this.display.style.fontSize = '16px';
        this.display.style.zIndex = '100';
        document.body.appendChild(this.display);
        this.updateDisplay();
    }

    updateDisplay() {
        this.display.textContent = `Blocks: ${this.getBlockCount()}`;
    }

    addBlock(id, blockData) {
        if (this.blocks.has(id)) {
            throw new Error(`Block with ID ${id} already exists.`);
        }
        this.blocks.set(id, blockData);
        this.updateDisplay();
    }

    removeBlock(id) {
        if (!this.blocks.has(id)) {
            throw new Error(`Block with ID ${id} does not exist.`);
        }
        this.blocks.delete(id);
        this.updateDisplay();
    }

    getBlock(id) {
        return this.blocks.get(id) || null;
    }

    getBlockCount() {
        return this.blocks.size;
    }

    listBlocks() {
        return Array.from(this.blocks.entries());
    }
}
