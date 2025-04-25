export class DisplayList {
    constructor() {
        this.objects = new Set();
    }

    add(object) {
        this.objects.add(object);
    }

    remove(object) {
        this.objects.delete(object);
    }

    get(object) {
        return this.objects.has(object) ? object : undefined;
    }

    clear() {
        this.objects.clear();
    }

    getAll() {
        return this.objects.values();
    }
}
