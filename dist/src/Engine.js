import { Commands } from "./Commands";
import { EntityManager } from "./Entities/EntityManager";
import { EntityAccess } from "./Entities/EntityAccess";
import { ResourceManager } from "./Resources/ResourceManager";
import { Resources } from "./Resources/Resources";
import { Start, PreUpdate, Update, PostUpdate, Render, } from "./Systems/Schedule";
import { SystemManager } from "./Systems/SystemManager";
import { DefaultRunner } from "./Runner";
import DefaultResources from "./Resources/DefaultResources";
export class Engine {
    constructor(runner) {
        this.systems = new SystemManager();
        this.resources = new ResourceManager();
        this.entities = new EntityManager();
        this.systemQueryResultCache = new Map();
        this.update = this.update.bind(this);
        const commands = new Commands(this.entities);
        this.addResource(DefaultResources.Commands, commands);
        const time = {
            delta: 0,
            current: 0,
            start: 0,
        };
        this.addResource(DefaultResources.Time, time);
        this.runner = runner || new DefaultRunner();
    }
    addResource(name, resource) {
        this.resources.add(name, resource);
        return this;
    }
    getResource(name) {
        return this.resources.get(name);
    }
    addSystem(schedule, system) {
        this.systems.add(schedule, system);
        return this;
    }
    run() {
        this.buildSystemQueryCache();
        const time = this.resources.get("time");
        time.current = performance.now() / 1000;
        this.runner.start(this.update);
    }
    stop() {
        this.runner.stop();
    }
    update(timestamp) {
        const time = this.resources.get(DefaultResources.Time);
        const timestamp_s = timestamp / 1000;
        time.delta = timestamp_s - time.current;
        time.current = timestamp_s;
        const commands = this.resources.get(DefaultResources.Commands);
        this.updateSystems(Start);
        this.playbackCommands(commands);
        this.systems.removeSystems(Start);
        this.playbackCommands(commands);
        this.updateSystems(PreUpdate);
        this.playbackCommands(commands);
        this.updateSystems(Update);
        this.playbackCommands(commands);
        this.updateSystems(PostUpdate);
        this.playbackCommands(commands);
        this.updateSystems(Render);
        this.playbackCommands(commands);
    }
    updateSystems(schedule) {
        const systems = this.systems.get(schedule);
        systems === null || systems === void 0 ? void 0 : systems.forEach(system => {
            if (!system.query) {
                system.run();
            }
            else {
                const queryResult = this.systemQueryResultCache.get(system);
                if (!queryResult) {
                    throw new Error("Query result not cached!");
                }
                if (queryResult.resources.count === 0 && queryResult.entities.count() === 0) {
                    return;
                }
                system.run(queryResult);
            }
        });
    }
    buildSystemQueryCache() {
        this.systems.getAll().forEach(system => {
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
    }
    playbackCommands(commands) {
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
                    var _a, _b, _c, _d;
                    const matchedAll = ((_b = (_a = system.query) === null || _a === void 0 ? void 0 : _a.all) === null || _b === void 0 ? void 0 : _b.every(component => archetype.components.has(component)))
                        || true;
                    if (!matchedAll) {
                        return false;
                    }
                    const matchedNone = ((_d = (_c = system.query) === null || _c === void 0 ? void 0 : _c.none) === null || _d === void 0 ? void 0 : _d.every(component => !archetype.components.has(component)))
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
        this.entities.clearDirtyArchetypes();
    }
}
