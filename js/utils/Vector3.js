export class Vector3 {
	constructor(x = 0, y = 0, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	set(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
		return this;
	}

	clone() {
		return new Vector3(this.x, this.y, this.z);
	}

	copy(vector) {
		this.x = vector.x;
		this.y = vector.y;
		this.z = vector.z;
		return this;
	}

	add(vector) {
		this.x += vector.x;
		this.y += vector.y;
		this.z += vector.z;
		return this;
	}

	subtract(vector) {
		this.x -= vector.x;
		this.y -= vector.y;
		this.z -= vector.z;
		return this;
	}

	multiply(vector) {
		this.x *= vector.x;
		this.y *= vector.y;
		this.z *= vector.z;
		return this;
	}

	multiplyScalar(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		return this;
	}

	divide(vector) {
		this.x /= vector.x;
		this.y /= vector.y;
		this.z /= vector.z;
		return this;
	}

	divideScalar(scalar) {
		if (scalar === 0) {
			console.warn('Division by zero in Vector3.divideScalar');
			return this;
		}
		return this.multiplyScalar(1 / scalar);
	}

	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	lengthSq() {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}

	normalize() {
		const length = this.length();
		if (length === 0) {
			return this;
		}
		return this.divideScalar(length);
	}

	dot(vector) {
		return this.x * vector.x + this.y * vector.y + this.z * vector.z;
	}

	cross(vector) {
		const x = this.y * vector.z - this.z * vector.y;
		const y = this.z * vector.x - this.x * vector.z;
		const z = this.x * vector.y - this.y * vector.x;

		this.x = x;
		this.y = y;
		this.z = z;

		return this;
	}

	distanceTo(vector) {
		const dx = this.x - vector.x;
		const dy = this.y - vector.y;
		const dz = this.z - vector.z;

		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	distanceToSq(vector) {
		const dx = this.x - vector.x;
		const dy = this.y - vector.y;
		const dz = this.z - vector.z;

		return dx * dx + dy * dy + dz * dz;
	}

	lerp(vector, alpha) {
		this.x += (vector.x - this.x) * alpha;
		this.y += (vector.y - this.y) * alpha;
		this.z += (vector.z - this.z) * alpha;
		return this;
	}

	equals(vector) {
		return this.x === vector.x && this.y === vector.y && this.z === vector.z;
	}

	floor() {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		this.z = Math.floor(this.z);
		return this;
	}

	ceil() {
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);
		this.z = Math.ceil(this.z);
		return this;
	}

	round() {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		this.z = Math.round(this.z);
		return this;
	}

	toString() {
		return `Vector3(${this.x}, ${this.y}, ${this.z})`;
	}

	toArray() {
		return [this.x, this.y, this.z];
	}

	fromArray(array) {
		this.x = array[0] || 0;
		this.y = array[1] || 0;
		this.z = array[2] || 0;
		return this;
	}

	// Static methods
	static add(a, b) {
		return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
	}

	static subtract(a, b) {
		return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
	}

	static multiply(a, b) {
		return new Vector3(a.x * b.x, a.y * b.y, a.z * b.z);
	}

	static multiplyScalar(vector, scalar) {
		return new Vector3(vector.x * scalar, vector.y * scalar, vector.z * scalar);
	}

	static distance(a, b) {
		return a.distanceTo(b);
	}

	static dot(a, b) {
		return a.dot(b);
	}

	static cross(a, b) {
		return a.clone().cross(b);
	}

	static lerp(a, b, alpha) {
		return a.clone().lerp(b, alpha);
	}
}
