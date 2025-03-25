import { Resource } from "./Query";
import { ResourceManager } from "./ResourceManager";
export declare class Resources {
    private resources;
    constructor(resourceManager: ResourceManager, resources?: Resource[]);
    get<T>(resource: Resource): Readonly<T> | undefined;
    getRW<T>(resource: Resource): T | undefined;
    get count(): number;
}
