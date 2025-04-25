import { TextureManager, DisplayList } from './modules.js';

export class Renderer {
    constructor() {
        // Initialize THREE.js scene
        this.scene = new THREE.Scene();

        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Update camera position and rotation
        this.camera.position.set(0, 100, 100); // Move camera back and up
        this.camera.lookAt(0, 0, 0); // Look at center

        // Add controls
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        
        // Handle click to start
        document.addEventListener('click', () => {
            this.controls.lock();
        });

        // Add fog to scene for depth
        this.scene.fog = new THREE.Fog(0x87ceeb, 0, 500);
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Initialize texture manager
        this.textureManager = new TextureManager();

        // Create block geometry
        this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);

        // Update block materials to use texture manager
        this.blockMaterials = {
            grass: this.textureManager.getMaterial('grass'),
            dirt: this.textureManager.getMaterial('dirt'),
            stone: this.textureManager.getMaterial('stone'),
            bedrock: this.textureManager.getMaterial('bedrock')
        };

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 100, 10);
        this.scene.add(ambientLight, directionalLight);

        // Add display list
        this.displayList = new DisplayList();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    addBlock(x, y, z, type) {
        const block = new THREE.Mesh(
            this.blockGeometry,
            this.blockMaterials[type]
        );
        block.position.set(x, y, z);
        this.scene.add(block);
        return this.displayList.add(block); // Return the ID instead of the block
    }

    removeBlock(id) {
        const block = this.displayList.get(id);
        if (block) {
            this.scene.remove(block);
            this.displayList.remove(id);
            return true;
        }
        return false;
    }

    clearDisplayList() {
        this.displayList.clear();
    }

    setPlayer(player) {
        this.player = player;
    }

    getPlayerChunk() {
        if (!this.player) return null;
        return {
            x: Math.floor(this.player.position.x / 16),
            z: Math.floor(this.player.position.z / 16)
        };
    }

    isChunkInRange(blockX, blockZ, renderDistance = 2) {
        const playerChunk = this.getPlayerChunk();
        if (!playerChunk) return false;

        const blockChunkX = Math.floor(blockX / 16);
        const blockChunkZ = Math.floor(blockZ / 16);

        return Math.abs(blockChunkX - playerChunk.x) <= renderDistance &&
               Math.abs(blockChunkZ - playerChunk.z) <= renderDistance;
    }

    render() {
        // Keep static objects (like lights) in a separate list
        const staticObjects = [
            new THREE.AmbientLight(0xffffff, 0.6),
            (() => {
                const light = new THREE.DirectionalLight(0xffffff, 0.8);
                light.position.set(10, 100, 10);
                return light;
            })()
        ];

        // Clear scene
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]);
        }

        // Add static objects
        for (const object of staticObjects) {
            this.scene.add(object);
        }

        // Add only blocks from visible chunks
        for (const object of this.displayList.getAll()) {
            if (this.isChunkInRange(object.position.x, object.position.z)) {
                this.scene.add(object);
            }
        }

        // Add debug axes
        const axesHelper = new THREE.AxesHelper(50);
        this.scene.add(axesHelper);

        // Add ground plane for reference
        if (!this.groundPlane) {
            const geometry = new THREE.PlaneGeometry(1000, 1000);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x404040,
                side: THREE.DoubleSide 
            });
            this.groundPlane = new THREE.Mesh(geometry, material);
            this.groundPlane.rotation.x = Math.PI / 2;
        }
        this.scene.add(this.groundPlane);

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}
