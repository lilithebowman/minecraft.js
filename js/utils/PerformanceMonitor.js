export class PerformanceMonitor {
	constructor() {
		this.fps = 0;
		this.frameCount = 0;
		this.lastTime = performance.now();
		this.fpsHistory = [];
		this.maxHistoryLength = 60;

		// Performance metrics
		this.metrics = {
			frameTime: 0,
			updateTime: 0,
			renderTime: 0,
			memoryUsage: 0
		};

		// Timing
		this.lastFrameTime = 0;
		this.deltaTime = 0;
		this.updateStartTime = 0;
		this.renderStartTime = 0;
	}

	update(deltaTime) {
		this.deltaTime = deltaTime;
		this.frameCount++;

		const currentTime = performance.now();
		this.metrics.frameTime = currentTime - this.lastFrameTime;
		this.lastFrameTime = currentTime;

		// Calculate FPS every second
		if (currentTime - this.lastTime >= 1000) {
			this.fps = this.frameCount;
			this.frameCount = 0;
			this.lastTime = currentTime;

			// Update FPS history
			this.fpsHistory.push(this.fps);
			if (this.fpsHistory.length > this.maxHistoryLength) {
				this.fpsHistory.shift();
			}

			// Update memory usage (if available)
			if (performance.memory) {
				this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
			}
		}
	}

	startUpdateTiming() {
		this.updateStartTime = performance.now();
	}

	endUpdateTiming() {
		this.metrics.updateTime = performance.now() - this.updateStartTime;
	}

	startRenderTiming() {
		this.renderStartTime = performance.now();
	}

	endRenderTiming() {
		this.metrics.renderTime = performance.now() - this.renderStartTime;
	}

	getFPS() {
		return this.fps;
	}

	getAverageFPS() {
		if (this.fpsHistory.length === 0) return 0;
		return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
	}

	getMinFPS() {
		if (this.fpsHistory.length === 0) return 0;
		return Math.min(...this.fpsHistory);
	}

	getMaxFPS() {
		if (this.fpsHistory.length === 0) return 0;
		return Math.max(...this.fpsHistory);
	}

	getMetrics() {
		return {
			...this.metrics,
			fps: this.fps,
			averageFPS: this.getAverageFPS(),
			minFPS: this.getMinFPS(),
			maxFPS: this.getMaxFPS(),
			deltaTime: this.deltaTime
		};
	}

	logMetrics() {
		const metrics = this.getMetrics();
		console.log('Performance Metrics:', {
			FPS: metrics.fps,
			'Frame Time': `${metrics.frameTime.toFixed(2)}ms`,
			'Update Time': `${metrics.updateTime.toFixed(2)}ms`,
			'Render Time': `${metrics.renderTime.toFixed(2)}ms`,
			'Memory Usage': `${metrics.memoryUsage.toFixed(2)}MB`
		});
	}

	dispose() {
		this.fpsHistory = [];
	}
}
