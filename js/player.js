export class Player {
    constructor(name, health = 100, position = { x: 0, y: 0, z: 0 }) {
        this.name = name;
        this.health = health;
        this.position = position;
        this.inventory = [];
        
        // Add movement properties
        this.velocity = { x: 0, y: 0, z: 0 };
        this.moveSpeed = 5;
        this.jumpForce = 10;
        this.gravity = -20;
        this.isGrounded = false;
    }

    move(x, y, z) {
        this.position.x += x;
        this.position.y += y;
        this.position.z += z;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
    }

    heal(amount) {
        this.health += amount;
        if (this.health > 100) {
            this.health = 100;
        }
    }

    addToInventory(item) {
        this.inventory.push(item);
    }

    removeFromInventory(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
        }
    }

    isAlive() {
        return this.health > 0;
    }

    update(deltaTime) {
        // Convert deltaTime to seconds
        const dt = deltaTime / 1000;

        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * dt;
        }

        // Update position based on velocity
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt;

        // Basic ground collision
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // Apply friction
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
    }

    jump() {
        if (this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
    }
}

export default Player;