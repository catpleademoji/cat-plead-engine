import { Commands } from "./Commands";
import { EntityManager } from "./Entities/EntityManager";
import { EntityAccess } from "./Entities/EntityAccess";
import { ResourceManager } from "./Resources/ResourceManager";
import { Resources } from "./Resources/Resources";
import Schedules from "./Systems/Schedule";
import { SystemManager } from "./Systems/SystemManager";
import { DefaultRunner } from "./Runner";
import DefaultResources from "./Resources/DefaultResources";
const DefaultOptions = {
    maxTimestep: 1 / 60 * 100,
    fixedTimestep: 1 / 60,
};
export class Engine {
    constructor(runner, options) {
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
            fixedDelta: 0,
        };
        this.addResource(DefaultResources.Time, time);
        if (runner && options) {
            this.runner = runner;
            this.maxTimestep = options.maxTimestep;
            this.fixedTimestep = options.fixedTimestep;
        }
        else if (runner && !options && "maxTimestep" in runner && "fixedTimestep" in runner) {
            this.runner = new DefaultRunner();
            this.maxTimestep = runner.maxTimestep;
            this.fixedTimestep = runner.fixedTimestep;
        }
        else if (runner && !options && "start" in runner && "stop" in runner) {
            this.runner = runner;
            this.maxTimestep = DefaultOptions.maxTimestep;
            this.fixedTimestep = DefaultOptions.fixedTimestep;
        }
        else {
            this.runner = new DefaultRunner();
            this.maxTimestep = DefaultOptions.maxTimestep;
            this.fixedTimestep = DefaultOptions.fixedTimestep;
        }
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
        if (this.resources.hasUpdates()) {
            this.updateQueryCacheResources();
        }
        const time = this.resources.get(DefaultResources.Time);
        const timestamp_s = timestamp / 1000;
        let delta = timestamp_s - time.current;
        if (delta >= this.maxTimestep) {
            delta = this.maxTimestep;
        }
        time.delta = delta;
        time.current = timestamp_s;
        const commands = this.resources.get(DefaultResources.Commands);
        this.updateSystems(Schedules.Start);
        this.playbackCommands(commands);
        this.systems.removeSystems(Schedules.Start);
        this.playbackCommands(commands);
        this.updateSystems(Schedules.PreUpdate);
        this.playbackCommands(commands);
        this.updateSystems(Schedules.Update);
        this.playbackCommands(commands);
        this.updateSystems(Schedules.PostUpdate);
        let remainingDelta = delta;
        while (remainingDelta >= this.fixedTimestep) {
            time.fixedDelta = this.fixedTimestep;
            this.playbackCommands(commands);
            this.updateSystems(Schedules.FixedUpdate);
            remainingDelta -= this.fixedTimestep;
        }
        this.playbackCommands(commands);
        this.updateSystems(Schedules.Render);
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
        const newArchetypes = this.entities.getNewArchetypes();
        if (newArchetypes.length === 0) {
            return;
        }
        this.systems.getAll().forEach(system => {
            if (!system.query) {
                return;
            }
            let queryResult = this.systemQueryResultCache.get(system);
            if (queryResult) {
                const needsUpdate = newArchetypes.some(archetype => {
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
        this.entities.clearNewArchetypes();
    }
    updateQueryCacheResources() {
        const newResources = this.resources.getNewResources();
        this.systems.getAll().forEach(system => {
            var _a, _b;
            if (!((_b = (_a = system.query) === null || _a === void 0 ? void 0 : _a.resources) === null || _b === void 0 ? void 0 : _b.some(res => newResources.has(res)))) {
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
        this.resources.handleUpdates();
    }
}
