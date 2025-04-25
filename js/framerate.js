export class Framerate {
    constructor() {
        this.frames = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.createDisplay();
    }

    createDisplay() {
        this.display = document.createElement('div');
        this.display.style.position = 'fixed';
        this.display.style.top = '10px';
        this.display.style.right = '10px';
        this.display.style.color = 'white';
        this.display.style.fontFamily = 'monospace';
        this.display.style.fontSize = '16px';
        this.display.style.zIndex = '100';
        document.body.appendChild(this.display);
    }

    update() {
        this.frames++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        // Update FPS counter every second
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.frames = 0;
            this.lastTime = currentTime;
            this.display.textContent = `${this.fps} FPS`;
        }
    }

    destroy() {
        if (this.display && this.display.parentNode) {
            this.display.parentNode.removeChild(this.display);
        }
    }
}
