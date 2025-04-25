export class Chunk {
    constructor(x, z) {
        this.x = x;
        this.z = z;
        this.blocks = new Array(16 * 256 * 16).fill(null);
        this.needsUpdate = false;
        this.mesh = null;
    }

    rebuildMesh() {
        // Get mesh data
        const meshData = this.generateMeshData();

        // Create or update geometry
        if (!this.mesh) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.vertices, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(meshData.texCoords, 2));
            this.mesh = new THREE.Mesh(geometry);
        } else {
            this.mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.vertices, 3));
            this.mesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(meshData.texCoords, 2));
            this.mesh.geometry.attributes.position.needsUpdate = true;
            this.mesh.geometry.attributes.uv.needsUpdate = true;
        }

        return this.mesh;
    }

    generateMeshData() {
        const vertices = [];
        const texCoords = [];
        let vertexCount = 0;

        // For each block in the chunk
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 256; y++) {
                for (let z = 0; z < 16; z++) {
                    const block = this.getBlock(x, y, z);
                    if (block) {
                        // Add vertices for visible faces
                        this.addBlockFaces(x, y, z, block, vertices, texCoords);
                        vertexCount += 24; // 4 vertices per face * 6 faces
                    }
                }
            }
        }

        return {
            vertices: new Float32Array(vertices),
            texCoords: new Float32Array(texCoords),
            vertexCount
        };
    }

    update(dt) {
        // Handle chunk physics updates
        // dt is in seconds
    }

    getBlock(x, y, z) {
        if (x < 0 || x >= 16 || y < 0 || y >= 256 || z < 0 || z >= 16) {
            return null;
        }
        return this.blocks[this.getIndex(x, y, z)];
    }

    setBlock(x, y, z, type) {
        if (x < 0 || x >= 16 || y < 0 || y >= 256 || z < 0 || z >= 16) {
            return;
        }
        this.blocks[this.getIndex(x, y, z)] = type;
        this.needsUpdate = true;
    }

    getIndex(x, y, z) {
        return (y * 16 * 16) + (z * 16) + x;
    }

    addBlockFaces(x, y, z, blockType, vertices, texCoords) {
        // Block face directions (right, left, top, bottom, front, back)
        const faces = [
            { dir: [1, 0, 0], check: [x + 1, y, z], uv: [0, 0, 1, 1] },
            { dir: [-1, 0, 0], check: [x - 1, y, z], uv: [0, 0, 1, 1] },
            { dir: [0, 1, 0], check: [x, y + 1, z], uv: [0, 0, 1, 1] },
            { dir: [0, -1, 0], check: [x, y - 1, z], uv: [0, 0, 1, 1] },
            { dir: [0, 0, 1], check: [x, y, z + 1], uv: [0, 0, 1, 1] },
            { dir: [0, 0, -1], check: [x, y, z - 1], uv: [0, 0, 1, 1] }
        ];

        // Add faces only if adjacent block is empty or transparent
        faces.forEach(face => {
            const [checkX, checkY, checkZ] = face.check;
            if (!this.getBlock(checkX, checkY, checkZ)) {
                this.addFace(x, y, z, face.dir, face.uv, vertices, texCoords);
            }
        });
    }

    addFace(x, y, z, dir, uv, vertices, texCoords) {
        // Convert block coordinates to world coordinates
        const wx = x + (this.x * 16);
        const wy = y;
        const wz = z + (this.z * 16);

        // Face vertices based on direction
        const [dx, dy, dz] = dir;
        if (dx !== 0) { // Right/Left face
            vertices.push(
                wx + dx, wy + 1, wz + 1,
                wx + dx, wy + 1, wz,
                wx + dx, wy, wz,
                wx + dx, wy, wz + 1
            );
        } else if (dy !== 0) { // Top/Bottom face
            vertices.push(
                wx, wy + dy, wz,
                wx + 1, wy + dy, wz,
                wx + 1, wy + dy, wz + 1,
                wx, wy + dy, wz + 1
            );
        } else { // Front/Back face
            vertices.push(
                wx, wy + 1, wz + dz,
                wx + 1, wy + 1, wz + dz,
                wx + 1, wy, wz + dz,
                wx, wy, wz + dz
            );
        }

        // Add texture coordinates
        const [u1, v1, u2, v2] = uv;
        texCoords.push(
            u1, v1,
            u2, v1,
            u2, v2,
            u1, v2
        );
    }
}