import { Commands } from "./Commands";
import { EntityManager } from "./EntityManager";
import { EntityIterator, QueryResult } from "./QueryResult";
import { ResourceManager } from "./ResourceManager";
import { Resources } from "./Resources";
import { Schedule, Start, PreUpdate, Update, PostUpdate, Render, } from "./Schedule";
import { System } from "./System";
import { SystemManager } from "./SystemManager";
import { Time } from "./Time";

export class Engine {
    private systems: SystemManager;
    private resources: ResourceManager;
    private entities: EntityManager;
    private systemQueryResultCache: Map<System, QueryResult>;

    constructor() {
        this.systems = new SystemManager();
        this.resources = new ResourceManager();
        this.entities = new EntityManager();

        this.systemQueryResultCache = new Map<System, QueryResult>();

        this.update = this.update.bind(this);

        const commands: Commands = new Commands(this.entities);
        this.addResource("commands", commands);
        const time: Time = {
            delta: 0,
            current: 0,
            start: 0,
        };
        this.addResource("time", time);
    }

    addResource(name: string, resource: unknown): this {
        this.resources.add(name, resource);
        return this;
    }

    addSystem(schedule: Schedule, system: System): this {
        this.systems.add(schedule, system);
        return this;
    }

    run() {
        this.runStartSystems();
        typeof requestAnimationFrame !== typeof undefined
            && requestAnimationFrame(this.update);
    }

    runStartSystems() {
        this.buildSystemQueryCache();
        
        this.updateSystems(Start);

        const commands = this.resources.get<Commands>("commands")!;
        this.playbackCommands(commands);
    }

    update(timestamp: DOMHighResTimeStamp) {
        const time = this.resources.get<Time>("time")!;
        const timestamp_s = timestamp / 1000;
        time.delta = timestamp_s - time.current;
        time.current = timestamp_s;

        const commands = this.resources.get<Commands>("commands")!;

        this.playbackCommands(commands);
        this.updateSystems(PreUpdate);

        this.playbackCommands(commands);
        this.updateSystems(Update);

        this.playbackCommands(commands);
        this.updateSystems(PostUpdate);

        this.playbackCommands(commands);
        this.updateSystems(Render);

        this.playbackCommands(commands);

        typeof requestAnimationFrame !== typeof undefined
            && requestAnimationFrame(this.update);
    }

    private updateSystems(schedule: Schedule) {
        const systems = this.systems.get(schedule);
        systems?.forEach(system => {
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
        })
    }

    private buildSystemQueryCache() {
        this.systems.getAll().forEach(system => {
            if (!system.query) {
                return;
            }

            const resources = new Resources(this.resources, system.query.resources);

            const chunks = this.entities.getChunks(system.query);

            const archetype = new Set([...system.query.all || [], ...system.query.any || []]);
            const entities = new EntityIterator(archetype, chunks);
            const queryResult = {
                resources,
                entities
            };

            this.systemQueryResultCache.set(system, queryResult);
        });
    }

    private playbackCommands(commands: Commands) {
        commands.playback();

        const dirtyArchetypes = this.entities.getDirtyArchetypes();
        if (dirtyArchetypes.length === 0) {
            return;
        }

        this.systems.getAll().forEach(system => {
            if (!system.query) {
                return;
            }

            let queryResult = this.systemQueryResultCache.get(system);
            if (queryResult) {
                const needsUpdate = dirtyArchetypes.some(archetype => {
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
            const entities = new EntityIterator(archetype, chunks);
            queryResult = {
                resources,
                entities
            };

            this.systemQueryResultCache.set(system, queryResult);
        });

        this.entities.clearDirtyArchetypes();
    }
}


