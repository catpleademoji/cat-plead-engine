export class ResourceManager {
    constructor() {
        this.resources = new Map();
    }
    add(name, resource) {
        this.resources.set(name, resource);
    }
    get(name) {
        return this.resources.get(name);
    }
}
