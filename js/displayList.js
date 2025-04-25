export class DisplayList {
    constructor() {
        this.objects = new Map();
        this.nextId = 0;
    }

    /**
     * Add an object to the display list
     * @param {THREE.Object3D} object - The object to add
     * @returns {number} The unique ID assigned to the object
     */
    add(object) {
        const id = this.nextId++;
        this.objects.set(id, object);
        return id;
    }

    /**
     * Remove an object from the display list
     * @param {number} id - The ID of the object to remove
     * @returns {boolean} True if object was removed, false if not found
     */
    remove(id) {
        return this.objects.delete(id);
    }

    /**
     * Get an object by its ID
     * @param {number} id - The ID of the object to retrieve
     * @returns {THREE.Object3D|undefined} The object, or undefined if not found
     */
    get(id) {
        return this.objects.get(id);
    }

    /**
     * Clear all objects from the display list
     */
    clear() {
        this.objects.clear();
    }

    /**
     * Get all objects in the display list
     * @returns {Iterator} Iterator of all objects
     */
    getAll() {
        return this.objects.values();
    }
}