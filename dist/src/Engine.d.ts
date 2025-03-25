import { Schedule } from "./Schedule";
import { System } from "./System";
export declare class Engine {
    private systems;
    private resources;
    private entities;
    private systemQueryResultCache;
    constructor();
    addResource(name: string, resource: unknown): this;
    addSystem(schedule: Schedule, system: System): this;
    run(): void;
    runStartSystems(): void;
    update(timestamp: DOMHighResTimeStamp): void;
    private updateSystems;
    private buildSystemQueryCache;
    private playbackCommands;
}
