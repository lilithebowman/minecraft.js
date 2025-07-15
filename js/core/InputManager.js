export class InputManager {
	constructor() {
		this.keys = {};
		this.mousePosition = { x: 0, y: 0 };
		this.mouseDelta = { x: 0, y: 0 };
		this.isPointerLocked = false;
		this.listeners = new Map();

		// Key mappings
		this.keyMappings = {
			'KeyW': 'forward',
			'KeyS': 'backward',
			'KeyA': 'left',
			'KeyD': 'right',
			'Space': 'jump',
			'ShiftLeft': 'sneak',
			'ShiftRight': 'sneak',
			'ControlLeft': 'sprint',
			'ControlRight': 'sprint'
		};

		// Bind methods
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleKeyUp = this.handleKeyUp.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseDown = this.handleMouseDown.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);
		this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
		this.handleContextMenu = this.handleContextMenu.bind(this);
	}

	initialize() {
		console.log('Initializing input manager...');
		this.setupEventListeners();
	}

	setupEventListeners() {
		// Keyboard events
		document.addEventListener('keydown', this.handleKeyDown);
		document.addEventListener('keyup', this.handleKeyUp);

		// Mouse events
		document.addEventListener('mousemove', this.handleMouseMove);
		document.addEventListener('mousedown', this.handleMouseDown);
		document.addEventListener('mouseup', this.handleMouseUp);
		document.addEventListener('contextmenu', this.handleContextMenu);

		// Pointer lock events
		document.addEventListener('pointerlockchange', this.handlePointerLockChange);
		document.addEventListener('pointerlockerror', this.handlePointerLockChange);

		// Initial pointer lock request
		document.body.addEventListener('click', () => {
			if (!this.isPointerLocked) {
				this.requestPointerLock();
			}
		});
	}

	handleKeyDown(event) {
		event.preventDefault();

		const action = this.keyMappings[event.code];
		if (action) {
			if (!this.keys[action]) {
				this.keys[action] = true;
				this.emit('keydown', action);

				// Handle specific actions
				if (action === 'jump') {
					this.emit('jump');
				} else if (['forward', 'backward', 'left', 'right'].includes(action)) {
					this.emit('move', action);
				} else if (action === 'sprint') {
					this.emit('sprint', true);
				} else if (action === 'sneak') {
					this.emit('sneak', true);
				}
			}
		}
	}

	handleKeyUp(event) {
		event.preventDefault();

		const action = this.keyMappings[event.code];
		if (action) {
			this.keys[action] = false;
			this.emit('keyup', action);

			// Handle specific actions
			if (action === 'sprint') {
				this.emit('sprint', false);
			} else if (action === 'sneak') {
				this.emit('sneak', false);
			} else if (['forward', 'backward', 'left', 'right'].includes(action)) {
				this.emit('stopmove', action);
			}
		}
	}

	handleMouseMove(event) {
		if (this.isPointerLocked) {
			this.mouseDelta.x = event.movementX || 0;
			this.mouseDelta.y = event.movementY || 0;

			this.emit('look', this.mouseDelta);
		}

		this.mousePosition.x = event.clientX;
		this.mousePosition.y = event.clientY;
	}

	handleMouseDown(event) {
		event.preventDefault();

		if (event.button === 0) { // Left click
			this.emit('leftclick', {
				x: event.clientX,
				y: event.clientY
			});
		} else if (event.button === 2) { // Right click
			this.emit('rightclick', {
				x: event.clientX,
				y: event.clientY
			});
		}
	}

	handleMouseUp(event) {
		event.preventDefault();

		if (event.button === 0) { // Left click
			this.emit('leftclickup', {
				x: event.clientX,
				y: event.clientY
			});
		} else if (event.button === 2) { // Right click
			this.emit('rightclickup', {
				x: event.clientX,
				y: event.clientY
			});
		}
	}

	handleContextMenu(event) {
		event.preventDefault();
		return false;
	}

	handlePointerLockChange() {
		this.isPointerLocked = document.pointerLockElement === document.body;

		if (this.isPointerLocked) {
			document.body.style.cursor = 'none';
		} else {
			document.body.style.cursor = 'default';
		}

		this.emit('pointerlockchange', this.isPointerLocked);
	}

	requestPointerLock() {
		document.body.requestPointerLock();
	}

	exitPointerLock() {
		document.exitPointerLock();
	}

	isKeyPressed(key) {
		return this.keys[key] || false;
	}

	getMousePosition() {
		return { ...this.mousePosition };
	}

	getMouseDelta() {
		return { ...this.mouseDelta };
	}

	update(deltaTime) {
		// Reset mouse delta after each frame
		this.mouseDelta.x = 0;
		this.mouseDelta.y = 0;

		// Emit continuous movement events
		if (this.keys.forward) this.emit('move', 'forward');
		if (this.keys.backward) this.emit('move', 'backward');
		if (this.keys.left) this.emit('move', 'left');
		if (this.keys.right) this.emit('move', 'right');
	}

	// Event system
	on(event, callback) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event).push(callback);
	}

	off(event, callback) {
		if (this.listeners.has(event)) {
			const callbacks = this.listeners.get(event);
			const index = callbacks.indexOf(callback);
			if (index > -1) {
				callbacks.splice(index, 1);
			}
		}
	}

	emit(event, data) {
		if (this.listeners.has(event)) {
			this.listeners.get(event).forEach(callback => {
				callback(data);
			});
		}
	}

	dispose() {
		// Remove event listeners
		document.removeEventListener('keydown', this.handleKeyDown);
		document.removeEventListener('keyup', this.handleKeyUp);
		document.removeEventListener('mousemove', this.handleMouseMove);
		document.removeEventListener('mousedown', this.handleMouseDown);
		document.removeEventListener('mouseup', this.handleMouseUp);
		document.removeEventListener('contextmenu', this.handleContextMenu);
		document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
		document.removeEventListener('pointerlockerror', this.handlePointerLockChange);

		// Clear listeners
		this.listeners.clear();

		// Exit pointer lock
		if (this.isPointerLocked) {
			this.exitPointerLock();
		}
	}
}
