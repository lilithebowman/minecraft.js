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

		// Dynamic performance adjustment
		this.targetFPS = 60;
		this.minFPS = 30;
		this.fpsStabilityThreshold = 5; // Frames before adjusting
		this.lastAdjustmentTime = 0;
		this.adjustmentCooldown = 2000; // 2 seconds between adjustments
		this.performanceLevel = 1.0; // 0.1 to 2.0 multiplier
		this.stableFrameCount = 0;
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

			// Adjust performance based on FPS
			this.adjustPerformanceLevel();
		}
	}

	/**
	 * Dynamically adjust performance level based on FPS
	 */
	adjustPerformanceLevel() {
		const currentTime = performance.now();

		// Don't adjust too frequently
		if (currentTime - this.lastAdjustmentTime < this.adjustmentCooldown) {
			return;
		}

		const avgFPS = this.getAverageFPS();
		const minFPS = this.getMinFPS();

		// Check if FPS is stable
		if (Math.abs(this.fps - avgFPS) < 5) {
			this.stableFrameCount++;
		} else {
			this.stableFrameCount = 0;
		}

		// Only adjust if we have stable readings
		if (this.stableFrameCount < this.fpsStabilityThreshold) {
			return;
		}

		let shouldAdjust = false;
		let adjustment = 0;

		// If FPS is below target, reduce performance level
		if (avgFPS < this.targetFPS - 10) {
			adjustment = -0.1;
			shouldAdjust = true;
		}
		// If FPS is well above target and stable, increase performance level
		else if (avgFPS > this.targetFPS + 5 && minFPS > this.targetFPS) {
			adjustment = 0.1;
			shouldAdjust = true;
		}

		if (shouldAdjust) {
			const oldLevel = this.performanceLevel;
			this.performanceLevel = Math.max(0.1, Math.min(2.0, this.performanceLevel + adjustment));

			if (this.performanceLevel !== oldLevel) {
				console.log(`Performance level adjusted: ${oldLevel.toFixed(2)} → ${this.performanceLevel.toFixed(2)} (FPS: ${avgFPS})`);
				this.lastAdjustmentTime = currentTime;
				this.stableFrameCount = 0;
			}
		}
	}

	/**
	 * Get current performance level (0.1 to 2.0)
	 */
	getPerformanceLevel() {
		return this.performanceLevel;
	}

	/**
	 * Get suggested block limits based on performance
	 */
	getBlockLimits() {
		const baseBlocksPerFrame = 200; // Increased from 50
		const baseBlocksPerChunk = 4000; // Increased from 1000
		const baseChunks = 49; // Increased from 25

		return {
			maxBlocksPerFrame: Math.floor(baseBlocksPerFrame * this.performanceLevel),
			maxBlocksPerChunk: Math.floor(baseBlocksPerChunk * this.performanceLevel),
			maxChunks: Math.floor(baseChunks * this.performanceLevel),
			updateThreshold: Math.max(8, Math.floor(32 / this.performanceLevel))
		};
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
			deltaTime: this.deltaTime,
			performanceLevel: this.performanceLevel,
			blockLimits: this.getBlockLimits()
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
