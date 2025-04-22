import { Schedule } from "./Systems/Schedule";
import { System } from "./Systems/System";
import { Runner } from "./Runner";
export declare class Engine {
    private systems;
    private resources;
    private entities;
    private systemQueryResultCache;
    private runner;
    constructor();
    constructor(runner: Runner);
    addResource(name: string, resource: unknown): this;
    getResource<T>(name: string): T | undefined;
    addSystem(schedule: Schedule, system: System): this;
    run(): void;
    stop(): void;
    update(timestamp: DOMHighResTimeStamp): void;
    private updateSystems;
    private buildSystemQueryCache;
    private playbackCommands;
}
