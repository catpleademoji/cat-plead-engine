import { Commands } from "./Commands";
import { EntityManager } from "./EntityManager";
import { EntityAccess } from "./EntityAccess";
import { ResourceManager } from "./ResourceManager";
import { Resources } from "./Resources";
import { Start, PreUpdate, Update, PostUpdate, Render, } from "./Schedule";
import { SystemManager } from "./SystemManager";
export class Engine {
    constructor(updaterFunction) {
        this.systems = new SystemManager();
        this.resources = new ResourceManager();
        this.entities = new EntityManager();
        this.systemQueryResultCache = new Map();
        this.update = this.update.bind(this);
        const commands = new Commands(this.entities);
        this.addResource("commands", commands);
        const time = {
            delta: 0,
            current: 0,
            start: 0,
        };
        this.addResource("time", time);
        this.updaterFunction = updaterFunction;
    }
    addResource(name, resource) {
        this.resources.add(name, resource);
        return this;
    }
    addSystem(schedule, system) {
        this.systems.add(schedule, system);
        return this;
    }
    run() {
        this.runStartSystems();
        if (this.updaterFunction) {
            this.updaterFunction(this.update);
        }
    }
    runStartSystems() {
        this.buildSystemQueryCache();
        this.updateSystems(Start);
        const commands = this.resources.get("commands");
        this.playbackCommands(commands);
    }
    update(timestamp) {
        const time = this.resources.get("time");
        const timestamp_s = timestamp / 1000;
        time.delta = timestamp_s - time.current;
        time.current = timestamp_s;
        const commands = this.resources.get("commands");
        this.playbackCommands(commands);
        this.updateSystems(PreUpdate);
        this.playbackCommands(commands);
        this.updateSystems(Update);
        this.playbackCommands(commands);
        this.updateSystems(PostUpdate);
        this.playbackCommands(commands);
        this.updateSystems(Render);
        this.playbackCommands(commands);
        if (this.updaterFunction) {
            this.updaterFunction(this.update);
        }
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
