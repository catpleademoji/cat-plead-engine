import { Resource } from "./Query";
import { ResourceManager } from "./ResourceManager";

export class Resources {
    resources: Map<string, unknown>;
    constructor(resourceManager: ResourceManager, resources?: Resource[]) {
        this.resources = new Map<Resource, unknown>();

        resources?.reduce((resources, key) => {
            const value = resourceManager.get(key);
            if (value) {
                resources.set(key, value);
            }
            return resources;
        }, this.resources);
    }

    get<T>(resource: Resource): Readonly<T> | undefined {
        return this.resources.get(resource) as T;
    }

    getRW<T>(resource: Resource): T | undefined {
        return this.resources.get(resource) as T;
    }
}