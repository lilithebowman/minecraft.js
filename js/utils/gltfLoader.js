import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelLoader {
    constructor() {
        this.loader = new GLTFLoader();
        this.models = new Map();
        this.loadingManager = new THREE.LoadingManager();
        this.setupLoadingManager();
    }

    setupLoadingManager() {
        this.loadingManager.onProgress = (url, loaded, total) => {
            console.log(`Loading model: ${url} (${Math.round(loaded/total * 100)}%)`);
        };

        this.loadingManager.onError = (url) => {
            console.error(`Error loading model: ${url}`);
        };

        this.loader.manager = this.loadingManager;
    }

    /**
     * Loads a GLTF model and stores it in the models Map
     * @param {string} name - Identifier for the model
     * @param {string} path - Path to the .gltf or .glb file
     * @returns {Promise<THREE.Mesh>} - The loaded model mesh
     */
    async loadModel(name, path) {
        try {
            if (this.models.has(name)) {
                return this.models.get(name);
            }

            const gltf = await this.loader.loadAsync(path);
            const model = gltf.scene;

            // Create a container mesh
            const container = new THREE.Mesh();
            container.add(model);

            // Store animations if they exist
            if (gltf.animations && gltf.animations.length > 0) {
                container.animations = gltf.animations;
                container.mixer = new THREE.AnimationMixer(model);
            }

            this.models.set(name, container);
            return container;

        } catch (error) {
            console.error(`Failed to load model ${name}:`, error);
            throw error;
        }
    }

    /**
     * Creates a new instance of a loaded model
     * @param {string} name - Name of the model to instance
     * @returns {THREE.Mesh} - New instance of the model
     */
    createInstance(name) {
        const original = this.models.get(name);
        if (!original) {
            throw new Error(`Model ${name} not loaded`);
        }

        const instance = original.clone(true);
        
        // Clone animations if they exist
        if (original.animations) {
            instance.animations = original.animations;
            instance.mixer = new THREE.AnimationMixer(instance);
        }

        return instance;
    }

    /**
     * Updates all animation mixers
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        for (const model of this.models.values()) {
            if (model.mixer) {
                model.mixer.update(deltaTime);
            }
        }
    }

    /**
     * Disposes of a model and its resources
     * @param {string} name - Name of the model to dispose
     */
    dispose(name) {
        const model = this.models.get(name);
        if (model) {
            model.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            this.models.delete(name);
        }
    }
}
