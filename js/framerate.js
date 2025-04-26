import { debug } from './debug.js';

export class Framerate {
    constructor() {
        this.frames = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.fpsUpdateInterval = 1000;
    }

    update() {
        this.frames++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        if (elapsed >= this.fpsUpdateInterval) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.frames = 0;
            this.lastTime = currentTime;
            
            // Update debug stats with current FPS
            debug.updateStats({
                fps: this.fps
            });
        }
    }

    getFPS() {
        return this.fps;
    }

    destroy() {
        this.frames = 0;
        this.fps = 0;
    }
}
