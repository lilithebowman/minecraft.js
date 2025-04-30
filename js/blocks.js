import { BlockTypes, BoxCollider } from './modules.js';
import * as THREE from 'three';
import { debug } from './debug.js';

export class Block {
    constructor(blockType = BlockTypes.GRASS, position = new THREE.Vector3(0, 0, 0)) {
        // Initialize blocks Map
        this.position = position;
        this.blockType = blockType;
        this.boxCollider = new BoxCollider(this.position, 1, 1, 1);
    }

    async initialize() {
        // console.log('Block initialized');
    }

    getObject3D() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = this.getMaterial(this.blockType);
        const mesh = new THREE.Mesh(geometry, material);
        const collider = this.boxCollider;
        mesh.userData.collider = collider; // Attach collider to the mesh

        // Set the position of the mesh
        mesh.position.set(this.position.x, this.position.y, this.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = this.blockType; // Set the name of the mesh to the block type
        mesh.userData.type = this.blockType; // Store block type in userData

        return mesh;
    }
}
