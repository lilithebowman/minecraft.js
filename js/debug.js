import * as THREE from 'three';

export class DebugLog {
    constructor() {
        this.createContainer();
        this.createStatsPanel();
        this.createConsolePanel();
        this.messages = [];
        this.maxMessages = 50;
        this.stats = {  
            fps: 0,
            position: { x: 0, y: 0, z: 0 },
            blocks: 0
        };

        // Create debug axes
        this.axesHelper = this.showDebugAxes();
        
        // Override console.log
        this.originalLog = console.log;
        console.log = (...args) => {
            this.log(...args);
            this.originalLog.apply(console, args);
        };
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            right: 10px;
            top: 10px;
            width: 300px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(this.container);
    }

    createStatsPanel() {
        this.statsPanel = document.createElement('div');
        this.statsPanel.style.cssText = `
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        `;
        this.container.appendChild(this.statsPanel);
    }

    // Show the debug axes
    showDebugAxes() {
        // Create axes helper
        const axesHelper = new THREE.AxesHelper(5);
        axesHelper.position.set(0, 0.1, 0); // Slightly above ground to be visible
        
        // Color coding for axes
        const materials = axesHelper.material;
        if (Array.isArray(materials)) {
            // X axis - red
            materials[0].color.setHex(0xff0000);
            // Y axis - green
            materials[1].color.setHex(0x00ff00);
            // Z axis - blue
            materials[2].color.setHex(0x0000ff);
        }
        
        return axesHelper;
    }

    createConsolePanel() {
        this.consolePanel = document.createElement('div');
        this.consolePanel.style.cssText = `
            height: 200px;
            overflow-y: auto;
            font-size: 11px;
        `;
        this.container.appendChild(this.consolePanel);
    }

    updateStats(stats) {
        this.stats = { 
            fps: stats.fps || this.stats.fps,
            position: stats.position || this.stats.position,
            blocks: stats.blocks || this.stats.blocks
        };
        this.statsPanel.innerHTML = `
            FPS: ${this.stats.fps}<br>
            Position: (${Math.round(this.stats.position.x)}, ${Math.round(this.stats.position.y)}, ${Math.round(this.stats.position.z)})<br>
            Blocks: ${this.stats.blocks}
        `;
    }

    log(...args) {
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        this.messages.unshift({
            time: new Date().toLocaleTimeString(),
            text: message
        });

        if (this.messages.length > this.maxMessages) {
            this.messages.pop();
        }

        this.updateConsole();
    }

    updateConsole() {
        this.consolePanel.innerHTML = this.messages
            .map(msg => `<div style="margin: 2px 0;"><span style="color: #aaa;">[${msg.time}]</span> ${msg.text}</div>`)
            .join('');
    }

    toggleAxes(scene) {
        if (this.axesHelper.parent) {
            scene.remove(this.axesHelper);
        } else {
            scene.add(this.axesHelper);
        }
    }
}

export const debug = new DebugLog();