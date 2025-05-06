import { BlockTypes, BoxCollider, TextureManager } from './modules.js';
import * as THREE from 'three';
import { debug } from './debug.js';

export class Block {
    constructor(blockType = BlockTypes.GRASS, position = new THREE.Vector3(0, 0, 0)) {
        // Initialize blocks Map
        this.position = position;
        this.blockType = blockType;
        this.boxCollider = new BoxCollider(this.position, 1, 1, 1);
        this.textureManager = new TextureManager();
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

        this.textureManager.initialize();

        return mesh;
    }

    getMaterial() {
        this.material = this.textureManager.getMaterial(this.blockType);
        return this.material; // Default to grass if type is unknown
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

    getMesh() {
        if (!this.mesh) {
            // Create the mesh if it doesn't exist
            this.mesh = this.getObject3D();
        }

        // Return the mesh object
        return this.mesh;
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

    dispose() {
        // Dispose of the block's resources
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
    }

    update() {
        // Update the block's position or other properties if needed
        this.boxCollider.update();
    }

    getBlockType() {
        return this.blockType;
    }

    setBlockType(blockType) {
        this.blockType = blockType;
        this.material = this.getMaterial(this.blockType);
        this.mesh.material = this.material;
    }

    getPosition() {
        return this.position;
    }

    setPosition(position) {
        this.position = position;
        this.boxCollider.setPosition(position);
    }

    getCollider() {
        return this.boxCollider;
    }

    setCollider(collider) {
        this.boxCollider = collider;
    }
}
