export declare class ResourceManager {
    private resources;
    private newResources;
    constructor();
    add(name: string, resource: unknown): void;
    get<T>(name: string): T | undefined;
    hasUpdates(): boolean;
    getNewResources(): Map<string, unknown>;
    handleUpdates(): void;
}
