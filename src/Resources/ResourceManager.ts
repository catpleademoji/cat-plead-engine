export class ResourceManager {
    private resources: Map<string, unknown>;

    constructor() {
        this.resources = new Map<string, unknown>();
    }

    add(name: string, resource: unknown) {
        this.resources.set(name, resource);
    }

    get<T>(name: string): T | undefined {
        return this.resources.get(name) as T;
    }
}
