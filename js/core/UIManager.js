/**
 * UI Manager - Handles all user interface elements
 */
export class UIManager {
	constructor() {
		this.debugPanel = document.getElementById('debug-panel');
		this.controlsInfo = document.getElementById('controls-info');
		this.crosshair = document.getElementById('crosshair');

		this.isDebugVisible = true;
		this.isControlsVisible = true;

		this.stats = {
			fps: 0,
			position: { x: 0, y: 0, z: 0 },
			chunk: '0,0',
			blockLookingAt: 'none'
		};

		// UI elements
		this.fpsCounter = null;
		this.positionInfo = null;
		this.chunkInfo = null;
		this.blockInfo = null;
	}

	/**
	 * Initialize UI system
	 */
	async initialize() {
		console.log('Initializing UI manager...');

		this.setupDebugPanel();
		this.setupCrosshair();
		this.setupEventListeners();

		console.log('UI manager initialized');
	}    /**
     * Set up debug panel elements
     */
	setupDebugPanel() {
		if (!this.debugPanel) {
			console.warn('Debug panel element not found');
			return;
		}

		// Get references to debug elements
		this.fpsCounter = document.getElementById('fps-counter');
		this.positionInfo = document.getElementById('position-info');
		this.chunkInfo = document.getElementById('chunk-info');
		this.blockInfo = document.getElementById('block-info');

		// Create elements if they don't exist
		if (!this.fpsCounter) {
			this.fpsCounter = document.createElement('div');
			this.fpsCounter.id = 'fps-counter';
			this.debugPanel.appendChild(this.fpsCounter);
		}

		if (!this.positionInfo) {
			this.positionInfo = document.createElement('div');
			this.positionInfo.id = 'position-info';
			this.debugPanel.appendChild(this.positionInfo);
		}

		if (!this.chunkInfo) {
			this.chunkInfo = document.createElement('div');
			this.chunkInfo.id = 'chunk-info';
			this.debugPanel.appendChild(this.chunkInfo);
		}

		if (!this.blockInfo) {
			this.blockInfo = document.createElement('div');
			this.blockInfo.id = 'block-info';
			this.debugPanel.appendChild(this.blockInfo);
		}

		// Add performance stats
		this.performanceInfo = document.createElement('div');
		this.performanceInfo.id = 'performance-info';
		this.debugPanel.appendChild(this.performanceInfo);
	}

	/**
	 * Set up crosshair
	 */
	setupCrosshair() {
		if (!this.crosshair) {
			console.warn('Crosshair element not found');
			return;
		}

		// Ensure crosshair is visible
		this.crosshair.style.display = 'block';
	}

	/**
	 * Set up event listeners
	 */
	setupEventListeners() {
		// Toggle debug panel with F3
		document.addEventListener('keydown', (event) => {
			if (event.key === 'F3') {
				event.preventDefault();
				this.toggleDebug();
			}
		});

		// Toggle controls info with F1
		document.addEventListener('keydown', (event) => {
			if (event.key === 'F1') {
				event.preventDefault();
				this.toggleControls();
			}
		});
	}

	/**
	 * Update UI with current game stats
	 */
	update(newStats) {
		this.stats = { ...this.stats, ...newStats };
		this.updateDebugPanel();
	}

	/**
	 * Update debug panel content
	 */
	updateDebugPanel() {
		if (!this.isDebugVisible) return;

		if (this.fpsCounter) {
			this.fpsCounter.textContent = `FPS: ${Math.round(this.stats.fps)}`;
		}

		if (this.positionInfo) {
			const pos = this.stats.position;
			this.positionInfo.textContent = `Position: ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`;
		}

		if (this.chunkInfo) {
			this.chunkInfo.textContent = `Chunk: ${this.stats.chunk}`;
		}

		if (this.blockInfo) {
			this.blockInfo.textContent = `Looking at: ${this.stats.blockLookingAt}`;
		}

		// Update performance info
		if (this.performanceInfo) {
			const memoryUsage = performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1) : 'N/A';
			const domNodes = document.getElementsByClassName('block').length;
			this.performanceInfo.innerHTML = `
				<div>Memory: ${memoryUsage} MB</div>
				<div>DOM Nodes: ${domNodes}</div>
				<div>Chunks: ${this.stats.chunkCount || 0}</div>
				<div>Blocks: ${this.stats.blockCount || 0}</div>
			`;
		}
	}

	/**
	 * Toggle debug panel visibility
	 */
	toggleDebug() {
		this.isDebugVisible = !this.isDebugVisible;

		if (this.debugPanel) {
			this.debugPanel.style.display = this.isDebugVisible ? 'block' : 'none';
		}

		console.log(`Debug panel ${this.isDebugVisible ? 'shown' : 'hidden'}`);
	}

	/**
	 * Toggle controls info visibility
	 */
	toggleControls() {
		this.isControlsVisible = !this.isControlsVisible;

		if (this.controlsInfo) {
			this.controlsInfo.style.display = this.isControlsVisible ? 'block' : 'none';
		}

		console.log(`Controls info ${this.isControlsVisible ? 'shown' : 'hidden'}`);
	}

	/**
	 * Show crosshair
	 */
	showCrosshair() {
		if (this.crosshair) {
			this.crosshair.style.display = 'block';
		}
	}

	/**
	 * Hide crosshair
	 */
	hideCrosshair() {
		if (this.crosshair) {
			this.crosshair.style.display = 'none';
		}
	}

	/**
	 * Show a temporary message to the user
	 */
	showMessage(message, duration = 3000, type = 'info') {
		const messageElement = document.createElement('div');
		messageElement.className = `message message-${type}`;
		messageElement.textContent = message;

		// Style the message
		messageElement.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 2000;
            text-align: center;
            min-width: 200px;
            max-width: 400px;
            backdrop-filter: blur(10px);
            animation: messageSlideIn 0.3s ease-out;
        `;

		// Add animation styles
		const style = document.createElement('style');
		style.textContent = `
            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -60%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }
        `;
		document.head.appendChild(style);

		document.body.appendChild(messageElement);

		// Remove message after duration
		setTimeout(() => {
			if (messageElement.parentNode) {
				messageElement.style.animation = 'messageSlideIn 0.3s ease-out reverse';
				setTimeout(() => {
					if (messageElement.parentNode) {
						messageElement.parentNode.removeChild(messageElement);
					}
				}, 300);
			}
		}, duration);
	}

	/**
	 * Show loading screen
	 */
	showLoadingScreen(message = 'Loading...') {
		const loadingElement = document.createElement('div');
		loadingElement.id = 'ui-loading-screen';
		loadingElement.className = 'loading-screen';
		loadingElement.innerHTML = `
            <div>${message}</div>
            <div class="loading-progress">
                <div class="loading-progress-bar" style="width: 0%"></div>
            </div>
        `;

		document.body.appendChild(loadingElement);

		// Animate progress bar
		const progressBar = loadingElement.querySelector('.loading-progress-bar');
		let progress = 0;
		const interval = setInterval(() => {
			progress += Math.random() * 20;
			if (progress > 100) {
				progress = 100;
				clearInterval(interval);
			}
			progressBar.style.width = `${progress}%`;
		}, 150);

		return {
			element: loadingElement,
			setProgress: (percent) => {
				progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
			},
			hide: () => {
				if (loadingElement.parentNode) {
					loadingElement.parentNode.removeChild(loadingElement);
				}
			}
		};
	}

	/**
	 * Hide loading screen
	 */
	hideLoadingScreen() {
		const loadingElement = document.getElementById('ui-loading-screen');
		if (loadingElement) {
			loadingElement.remove();
		}
	}

	/**
	 * Show error message
	 */
	showError(message) {
		this.showMessage(message, 5000, 'error');
	}

	/**
	 * Show success message
	 */
	showSuccess(message) {
		this.showMessage(message, 3000, 'success');
	}

	/**
	 * Get UI state
	 */
	getState() {
		return {
			debugVisible: this.isDebugVisible,
			controlsVisible: this.isControlsVisible,
			stats: this.stats
		};
	}

	/**
	 * Set UI state
	 */
	setState(state) {
		if (state.debugVisible !== undefined) {
			this.isDebugVisible = state.debugVisible;
			if (this.debugPanel) {
				this.debugPanel.style.display = this.isDebugVisible ? 'block' : 'none';
			}
		}

		if (state.controlsVisible !== undefined) {
			this.isControlsVisible = state.controlsVisible;
			if (this.controlsInfo) {
				this.controlsInfo.style.display = this.isControlsVisible ? 'block' : 'none';
			}
		}

		if (state.stats) {
			this.stats = { ...this.stats, ...state.stats };
		}
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		console.log('Disposing UI manager...');

		// Clear references
		this.debugPanel = null;
		this.controlsInfo = null;
		this.crosshair = null;
		this.fpsCounter = null;
		this.positionInfo = null;
		this.chunkInfo = null;
		this.blockInfo = null;

		// Remove any temporary messages
		const messages = document.querySelectorAll('.message');
		messages.forEach(message => {
			if (message.parentNode) {
				message.parentNode.removeChild(message);
			}
		});

		// Hide loading screen
		this.hideLoadingScreen();

		console.log('UI manager disposed');
	}
}
