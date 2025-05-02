import * as THREE from 'three';
import { debug } from './debug.js';
import { getSolidBlockTypes } from './BlockTypes.js';

export class BlockMeshRenderer {
	constructor(blockTypes = getSolidBlockTypes()) {
		// Maximum instances per block type
		this.INSTANCES_PER_TYPE = 10000;

		// Store block types
		this.blockTypes = blockTypes;

		// Create block geometry once to be reused
		this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);

		// Store instanced meshes by block type
		this.instancedMeshes = new Map();

		// Pre-allocate buffers for instance data
		this.instanceBuffers = new Map();
		this.blockTypes.forEach(type => {
			this.instanceBuffers.set(type, {
				matrices: new Float32Array(this.INSTANCES_PER_TYPE * 16),
				count: 0
			});
		});

		// Create a group for all block meshes
		this.meshGroup = new THREE.Group();

		// Initialize worker for block instancing
		this.initializeWorker();
	}

	initializeWorker() {
		this.blockWorker = new Worker(
			new URL('./workers/blockInstanceWorker.js', import.meta.url),
			{ type: 'module' }
		);

		this.blockWorker.onmessage = (e) => {
			const { instanceData } = e.data;

			// Update instance matrices
			for (const [type, data] of instanceData) {
				const mesh = this.instancedMeshes.get(type);
				if (mesh) {
					mesh.count = data.count;
					for (let i = 0; i < data.count; i++) {
						mesh.setMatrixAt(i, new THREE.Matrix4().fromArray(data.positions[i]));
					}
					mesh.instanceMatrix.needsUpdate = true;
				}
			}
		};
	}

	getBlockMesh() {
		// Create instanced meshes for each block type
		this.blockTypes.forEach(type => {
			const mesh = this.instancedMeshes.get(type);
			if (mesh) {
				mesh.count = 0; // Start with 0 instances
			}
		});

		return this.meshGroup;
	}

	createInstancedMeshes(textureManager) {
		// Create instanced mesh for each block type
		for (const type of this.blockTypes) {
			const material = textureManager.getMaterial(type);
			const instancedMesh = new THREE.InstancedMesh(
				this.blockGeometry,
				material,
				this.INSTANCES_PER_TYPE
			);
			instancedMesh.count = 0; // Start with 0 instances
			this.instancedMeshes.set(type, instancedMesh);
			this.meshGroup.add(instancedMesh);
		}

		return this.meshGroup;
	}

	updateMeshes(visibleChunks, camera, frustum) {
		// Get instance data from visible chunks
		const instanceData = this.getInstanceData(visibleChunks, camera);

		// Send instance data to block worker
		this.blockWorker.postMessage({
			instanceData,
			frustum: frustum.toJSON()
		});

		// Process instance data for each block type
		for (const [type, data] of instanceData.entries()) {
			const mesh = this.instancedMeshes.get(type);
			if (mesh) {
				mesh.count = data.count;
				mesh.instanceMatrix.array.set(data.positions);
				mesh.instanceMatrix.needsUpdate = true;
			}
		}
	}

	getInstanceData(visibleChunks, camera) {
		const instanceData = new Map();

		// Initialize data structure for each block type
		this.blockTypes.forEach(type => {
			instanceData.set(type, {
				count: 0,
				positions: []
			});
		});

		// Process each visible chunk
		for (const chunk of visibleChunks) {
			// Get blocks from chunk
			const blocks = chunk.getLocalBlocks(camera);

			// Process each block
			for (const block of blocks) {
				const data = instanceData.get(block.type);
				if (data && data.count < this.INSTANCES_PER_TYPE) {
					// Create transformation matrix
					const matrix = new THREE.Matrix4();
					matrix.setPosition(
						block.position.x,
						block.position.y,
						block.position.z
					);

					// Store matrix elements
					data.positions.push(Array.from(matrix.elements));
					data.count++;
				}
			}
		}

		// Truncate the array at 1000 elements if necessary
		for (const [type, data] of instanceData.entries()) {
			if (data.count > this.INSTANCES_PER_TYPE) {
				data.positions = data.positions.slice(0, this.INSTANCES_PER_TYPE);
				data.count = this.INSTANCES_PER_TYPE;
			}
		}

		// debug.log(`Processing ${visibleChunks.length} chunks`);
		// debug.log(`Total instances: ${Array.from(instanceData.values()).reduce((sum, data) => sum + data.count, 0)}`);

		return instanceData;
	}

	handleChunkProcessorMessage(e) {
		const { instanceData } = e.data;
		console.log(`Received processor data for ${instanceData.size} block types`);

		// Update instance meshes
		for (const [type, data] of instanceData) {
			const mesh = this.instancedMeshes.get(type);
			if (mesh && data.count > 0) {
				console.log(`Setting ${data.count} instances for ${type}`);
				mesh.count = data.count;

				// Update instance matrix
				if (data.positions && data.positions.length > 0) {
					for (let i = 0; i < data.count; i++) {
						const matrix = new THREE.Matrix4();
						matrix.fromArray(data.positions[i]);
						mesh.setMatrixAt(i, matrix);
					}
					mesh.instanceMatrix.needsUpdate = true;
				}
			}
		}
	}

	addDebugBlocks(scene) {
		// Place blocks in a row 2 units in front of player spawn
		const spacing = 2; // Space between blocks

		this.blockTypes.forEach((type, index) => {
			const matrix = new THREE.Matrix4();
			matrix.setPosition(
				0,           // x: centered
				1,           // y: one block up
				index * spacing + 2  // z: spaced out in front of player
			);

			const mesh = this.instancedMeshes.get(type);
			if (mesh) {
				mesh.count = 1;
				mesh.setMatrixAt(0, matrix);
				mesh.instanceMatrix.needsUpdate = true;
			}
		});
	}

	dispose() {
		// Terminate worker
		if (this.blockWorker) {
			this.blockWorker.terminate();
			this.blockWorker = null;
		}

		// Dispose all geometries and materials
		if (this.blockGeometry) {
			this.blockGeometry.dispose();
		}

		// Clear all instanced meshes
		this.instancedMeshes.forEach(mesh => {
			mesh.dispose && mesh.dispose();
		});
		this.instancedMeshes.clear();

		// Clear buffers
		this.instanceBuffers.clear();
	}
}
