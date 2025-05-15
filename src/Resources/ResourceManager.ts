export class ResourceManager {
    private resources: Map<string, unknown>;
    private newResources: Map<string, unknown>;

    constructor() {
        this.resources = new Map<string, unknown>();
        this.newResources = new Map<string, unknown>();
    }

    add(name: string, resource: unknown) {
        this.resources.set(name, resource);
        this.newResources.set(name, resource);
    }

    get<T>(name: string): T | undefined {
        return this.resources.get(name) as T;
    }

    remove(name: string) {
        this.resources.delete(name);
    }

    hasUpdates(): boolean {
        return this.newResources.size > 0;
    }
    
    getNewResources(): Map<string, unknown> {
        return this.newResources;
    }

    handleUpdates() {
        this.newResources.clear();
    }
}
