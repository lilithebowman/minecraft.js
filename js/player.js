import * as THREE from 'three';
import { Force } from './physics/force.js';
import { Position } from './physics/position.js';
import { Velocity } from './physics/velocity.js';

export class Player {
    constructor(position) {
        this.position = position; // { x, y, z }
        this.size = { x: 0.6, y: 1.8, z: 0.6 }; // Player's bounding box size
    }

    checkForBlocksNearPlayer(chunks) {
        const playerBottom = Math.floor(this.position.y);
        const playerTop = Math.ceil(this.position.y + this.size.y);

        for (let y = playerBottom; y <= playerTop; y++) {
            const block = this.getBlockAtPosition(this.position.x, y, this.position.z, chunks);
            if (block) {
                // Place the player on top of the block
                this.position.y = y + 1;
                break;
            }
        }
    }

    getBlockAtPosition(x, y, z, chunks) {
        const chunkX = Math.floor(x / 16);
        const chunkZ = Math.floor(z / 16);
        const localX = (Math.floor(x) % 16 + 16) % 16;
        const localZ = (Math.floor(z) % 16 + 16) % 16;

        const chunkKey = `${chunkX},${chunkZ}`;
        const chunk = chunks.get(chunkKey); // Assuming chunks is a Map
        if (!chunk) return null;

        return chunk.getBlock(localX, Math.floor(y), localZ);
    }
}

export default Player;