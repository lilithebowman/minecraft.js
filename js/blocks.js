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
        this.createBlock(this.blockType, this.position);
    }

    createBlock(blockType, position) {
        this.blockType = blockType;
        this.position = position;
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = this.getMaterial(this.blockType);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.position.x, this.position.y, this.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = this.blockType; // Set the name of the mesh to the block type
        mesh.userData.type = this.blockType; // Store block type in userData

        return mesh;
    }

    getMaterial(blockType) {
        // Define materials for different block types
        const materials = {
            [BlockTypes.GRASS]: new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
            [BlockTypes.STONE]: new THREE.MeshStandardMaterial({ color: 0x808080 }),
            [BlockTypes.DIRT]: new THREE.MeshStandardMaterial({ color: 0x8B4513 }),
            [BlockTypes.WATER]: new THREE.MeshStandardMaterial({ color: 0x0000ff }),
            [BlockTypes.SAND]: new THREE.MeshStandardMaterial({ color: 0xFFFF00 }),
        };

        return materials[blockType] || materials[BlockTypes.GRASS]; // Default to grass if type is unknown
    }

    getCollider() {
        // Return the collider object
        return this.boxCollider;
    }
    setCollider(collider) {
        // Set the collider object
        this.boxCollider = collider;
    }

    getPosition() {
        // Return the position of the block
        return this.position;
    }
    setPosition(position) {
        // Set the position of the block
        this.position = position;
        this.boxCollider.setPosition(position);
    }


    getBlockType() {
        // Return the block type
        return this.blockType;
    }
    setBlockType(blockType) {
        // Set the block type
        this.blockType = blockType;
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
