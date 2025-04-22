export class Resources {
    constructor(resourceManager, resources) {
        this.resources = new Map();
        resources === null || resources === void 0 ? void 0 : resources.reduce((resources, key) => {
            const value = resourceManager.get(key);
            if (value) {
                resources.set(key, value);
            }
            return resources;
        }, this.resources);
    }
    get(resource) {
        return this.resources.get(resource);
    }
    getRW(resource) {
        return this.resources.get(resource);
    }
    get count() {
        return this.resources.size;
    }
}
