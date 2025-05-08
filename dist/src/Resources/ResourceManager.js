export class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.newResources = new Map();
    }
    add(name, resource) {
        this.resources.set(name, resource);
        this.newResources.set(name, resource);
    }
    get(name) {
        return this.resources.get(name);
    }
    hasUpdates() {
        return this.newResources.size > 0;
    }
    getNewResources() {
        return this.newResources;
    }
    handleUpdates() {
        this.newResources.clear();
    }
}
