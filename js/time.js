export class Time {
    constructor() {
        this._lastTime = performance.now();
        this._deltaTime = 0;
        this._fixedDeltaTime = 1000 / 60; // 60 FPS
        this._timeScale = 1;
    }

    /**
     * Updates the time tracking system
     * Should be called once per frame
     */
    update() {
        const currentTime = performance.now();
        this._deltaTime = (currentTime - this._lastTime) * this._timeScale;
        this._lastTime = currentTime;
    }

    /**
     * Gets the time elapsed since last frame in milliseconds
     * @returns {number} Delta time in milliseconds
     */
    get deltaTime() {
        return this._deltaTime;
    }

    /**
     * Gets the fixed time step in milliseconds
     * @returns {number} Fixed delta time in milliseconds
     */
    get fixedDeltaTime() {
        return this._fixedDeltaTime;
    }

    /**
     * Gets the current time scale
     * @returns {number} Time scale multiplier
     */
    get timeScale() {
        return this._timeScale;
    }

    /**
     * Sets the time scale multiplier
     * @param {number} value - New time scale value
     */
    set timeScale(value) {
        this._timeScale = Math.max(0, value);
    }
}
