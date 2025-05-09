import { Schedule } from "./Systems/Schedule";
import { System } from "./Systems/System";
import { Runner } from "./Runner";
import { SystemGroup } from "./Systems/SystemGroup";
export type EngineOptions = {
    maxTimestep: number;
    fixedTimestep: number;
};
export declare class Engine {
    private systems;
    private resources;
    private entities;
    private systemQueryResultCache;
    private runner;
    private maxTimestep;
    private fixedTimestep;
    constructor(options?: EngineOptions);
    constructor(runner: Runner, options?: EngineOptions);
    addResource(name: string, resource: unknown): this;
    getResource<T>(name: string): T | undefined;
    addSystem(schedule: Schedule, system: System): this;
    addSystemGroup(schedule: Schedule, systemGroup: SystemGroup): this;
    run(): void;
    stop(): void;
    update(timestamp: DOMHighResTimeStamp): void;
    private updateSystems;
    private buildSystemQueryCache;
    private playbackCommands;
    private updateQueryCacheResources;
}
