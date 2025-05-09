import { Commands } from "./Commands";
import { EntityManager } from "./Entities/EntityManager";
import { QueryResult } from "./Queries/QueryResult";
import { EntityAccess } from "./Entities/EntityAccess";
import { ResourceManager } from "./Resources/ResourceManager";
import { Resources } from "./Resources/Resources";
import { Schedule, Schedules } from "./Systems/Schedule";
import { System } from "./Systems/System";
import { SystemManager } from "./Systems/SystemManager";
import { Time } from "./Time";
import { Runner, DefaultRunner } from "./Runner";
import { DefaultResources } from "./Resources/DefaultResources";
import { SystemGroup } from "./Systems/SystemGroup";

export type EngineOptions = {
    maxTimestep: number;
    fixedTimestep: number;
}

const DefaultOptions: EngineOptions = {
    maxTimestep: 1 / 60 * 5,
    fixedTimestep: 1 / 60,
}

export class Engine {
    private systems: SystemManager;
    private resources: ResourceManager;
    private entities: EntityManager;
    private systemQueryResultCache: Map<System, QueryResult>;

    private runner: Runner;
    private maxTimestep: number;
    private fixedTimestep: number;
    private cumulativeFixedDelta: number;

    constructor(options?: EngineOptions);
    constructor(runner: Runner, options?: EngineOptions);
    constructor(runner?: Runner | EngineOptions, options?: EngineOptions) {
        this.systems = new SystemManager();
        this.resources = new ResourceManager();
        this.entities = new EntityManager();

        this.systemQueryResultCache = new Map<System, QueryResult>();

        this.update = this.update.bind(this);

        const commands: Commands = new Commands(this.entities);
        this.addResource(DefaultResources.Commands, commands);
        const time: Time = {
            delta: 0,
            current: 0,
            start: 0,
            fixedDelta: 0,
        };
        this.cumulativeFixedDelta = 0;

        this.addResource(DefaultResources.Time, time);

        if (runner && options) {
            this.runner = runner as Runner;
            this.maxTimestep = options.maxTimestep;
            this.fixedTimestep = options.fixedTimestep;
        } else if (runner && !options && "maxTimestep" in runner && "fixedTimestep" in runner) {
            this.runner = new DefaultRunner();
            this.maxTimestep = runner.maxTimestep;
            this.fixedTimestep = runner.fixedTimestep;
        } else if (runner && !options && "start" in runner && "stop" in runner) {
            this.runner = runner;
            this.maxTimestep = DefaultOptions.maxTimestep;
            this.fixedTimestep = DefaultOptions.fixedTimestep;
        } else {
            this.runner = new DefaultRunner();
            this.maxTimestep = DefaultOptions.maxTimestep;
            this.fixedTimestep = DefaultOptions.fixedTimestep;
        }
    }

    addResource(name: string, resource: unknown): this {
        this.resources.add(name, resource);
        return this;
    }

    getResource<T>(name: string) {
        return this.resources.get<T>(name);
    }

    addSystem(schedule: Schedule, system: System): this {
        this.systems.add(schedule, system);
        return this;
    }

    addSystemGroup(schedule: Schedule, systemGroup: SystemGroup): this {
        this.systems.addGroup(schedule, systemGroup);
        return this;
    }

    run() {
        this.buildSystemQueryCache();
        const time = this.resources.get<Time>("time")!;
        time.current = performance.now() / 1000;

        this.runner.start(this.update);
    }

    stop() {
        this.runner.stop();
    }

    update(timestamp: DOMHighResTimeStamp) {
        if (this.resources.hasUpdates()) {
            this.updateQueryCacheResources();
        }

        const time = this.resources.get<Time>(DefaultResources.Time)!;
        const timestamp_s = timestamp / 1000;

        let delta = timestamp_s - time.current;
        if (delta >= this.maxTimestep) {
            delta = this.maxTimestep;
        }
        time.delta = delta;
        time.current = timestamp_s;

        const commands = this.resources.get<Commands>(DefaultResources.Commands)!;

        this.runStartSystems();
        this.playbackCommands(commands);

        this.playbackCommands(commands);
        this.updateSystems(Schedules.PreUpdate);

        this.playbackCommands(commands);
        this.updateSystems(Schedules.Update);

        this.playbackCommands(commands);
        this.updateSystems(Schedules.PostUpdate);

        this.cumulativeFixedDelta += delta;
        while (this.cumulativeFixedDelta >= this.fixedTimestep) {
            time.fixedDelta = this.fixedTimestep;

            this.playbackCommands(commands);
            this.updateSystems(Schedules.FixedUpdate);

            this.cumulativeFixedDelta -= this.fixedTimestep;
        }

        this.playbackCommands(commands);
        this.updateSystems(Schedules.Render);

        this.playbackCommands(commands);
    }

    private runStartSystems() {
        const systemGroups = this.systems.get(Schedules.Start);
        systemGroups?.forEach(systemGroup => {
            if (!systemGroup.canRun(this.resources)) {
                return;
            }

            const unrunSystems = systemGroup.systems.filter(system => {
                if (!system.query) {
                    system.run();
                } else {
                    const queryResult = this.systemQueryResultCache.get(system)!;
                    if (!queryResult) {
                        throw new Error("Query result not cached!");
                    }

                    if (queryResult.resources.count === 0 && queryResult.entities.count() === 0) {
                        return true;
                    }

                    system.run(queryResult);
                }
                return false;
            });

            systemGroup.systems = unrunSystems;
        });
    }

    private updateSystems(schedule: Schedule) {
        const systemGroups = this.systems.get(schedule);
        systemGroups?.forEach(systemGroup => {
            if (!systemGroup.canRun(this.resources)) {
                return;
            }

            systemGroup.systems.forEach(system => {
                if (!system.query) {
                    system.run();
                } else {
                    const queryResult = this.systemQueryResultCache.get(system)!;
                    if (!queryResult) {
                        throw new Error("Query result not cached!");
                    }

                    if (queryResult.resources.count === 0 && queryResult.entities.count() === 0) {
                        return;
                    }

                    system.run(queryResult);
                }
            });
        });
    }

    private buildSystemQueryCache() {
        this.systems.getAll().forEach(systemGroup => {
            systemGroup.systems.forEach(system => {
                if (!system.query) {
                    return;
                }

                const resources = new Resources(this.resources, system.query.resources);

                const chunks = this.entities.getChunks(system.query);

                const archetype = new Set([...system.query.all || [], ...system.query.any || []]);
                const entities = new EntityAccess(this.entities, archetype, chunks);
                const queryResult = {
                    resources,
                    entities
                };

                this.systemQueryResultCache.set(system, queryResult);
            });
        });
    }

    private playbackCommands(commands: Commands) {
        commands.playback();

        const newArchetypes = this.entities.getNewArchetypes();
        if (newArchetypes.length === 0) {
            return;
        }

        this.systems.getAll().forEach(systemGroup => {
            systemGroup.systems.forEach(system => {
                if (!system.query) {
                    return;
                }

                let queryResult = this.systemQueryResultCache.get(system);
                if (queryResult) {
                    const needsUpdate = newArchetypes.some(archetype => {
                        const matchedAll = system.query?.all?.every(component => archetype.components.has(component))
                            || true;
                        if (!matchedAll) {
                            return false;
                        }

                        const matchedNone = system.query?.none?.every(component => !archetype.components.has(component))
                            || true;
                        if (!matchedNone) {
                            return false;
                        }

                        return true;
                    });

                    if (!needsUpdate) {
                        return;
                    }
                }

                const resources = new Resources(this.resources, system.query.resources);

                const chunks = this.entities.getChunks(system.query);

                const archetype = new Set([...system.query.all || [], ...system.query.any || []]);
                const entities = new EntityAccess(this.entities, archetype, chunks);
                queryResult = {
                    resources,
                    entities
                };

                this.systemQueryResultCache.set(system, queryResult);
            });
        });

        this.entities.clearNewArchetypes();
    }

    private updateQueryCacheResources() {
        const newResources = this.resources.getNewResources();
        this.systems.getAll().forEach(systemGroup => {
            systemGroup.systems.forEach(system => {
                if (!system.query?.resources?.some(res => newResources.has(res))) {
                    return;
                }

                let queryResult = this.systemQueryResultCache.get(system);
                if (queryResult) {
                    const resources = new Resources(this.resources, system.query.resources);

                    const chunks = this.entities.getChunks(system.query);

                    const archetype = new Set([...system.query.all || [], ...system.query.any || []]);
                    const entities = new EntityAccess(this.entities, archetype, chunks);
                    queryResult = {
                        resources,
                        entities
                    };

                    this.systemQueryResultCache.set(system, queryResult);
                }
            });
        });
        this.resources.handleUpdates();
    }
}
