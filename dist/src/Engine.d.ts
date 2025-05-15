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
    private cumulativeFixedDelta;
    constructor(options?: EngineOptions);
    constructor(runner: Runner, options?: EngineOptions);
    addResource(name: string, resource: unknown): this;
    getResource<T>(name: string): T | undefined;
    removeResource(name: string): void;
    addSystem(schedule: Schedule, system: System): this;
    addSystemGroup(schedule: Schedule, systemGroup: SystemGroup): this;
    getDefaultSystemGroup(schedule: Schedule): SystemGroup | undefined;
    removeSystem(schedule: Schedule, systemGroup: SystemGroup, system: System): void;
    clearEntities(): void;
    run(): void;
    stop(): void;
    update(timestamp: DOMHighResTimeStamp): void;
    private runStartSystems;
    private updateSystems;
    private buildSystemQueryCache;
    private playbackCommands;
    private updateQueryCacheResources;
}
