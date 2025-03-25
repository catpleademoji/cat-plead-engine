export declare class ResourceManager {
    private resources;
    constructor();
    add(name: string, resource: unknown): void;
    get<T>(name: string): T | undefined;
}
