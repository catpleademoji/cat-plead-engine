import { Commands } from "./Commands";
import { EntityManager } from "./EntityManager";
import { EntityIterator } from "./QueryResult";
import { ResourceManager } from "./ResourceManager";
import { Resources } from "./Resources";
import { PostUpdate, PreUpdate, Render, Schedule, Start, Update } from "./Schedule";
import { System } from "./System";
import { SystemManager } from "./SystemManager";
import { Time } from "./Time";

export type EntityRecord = {
    version: number;
    chunkIndex: number;
    rowIndex: number;
}

export class Engine {
    private systems: SystemManager;
    private resources: ResourceManager;
    private entities: EntityManager;

    constructor() {
        this.systems = new SystemManager();
        this.resources = new ResourceManager();
        this.entities = new EntityManager();

        this.update = this.update.bind(this);
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
        const time: Time = {
            delta: 0,
            current: 0,
            start: 0,
        };
        this.addResource("time", time);

        const commands: Commands = new Commands(this.entities);
        this.addResource("commands", commands);

        this.updateSystems(Start);

        requestAnimationFrame(this.update);
    }

    private update(timestamp: DOMHighResTimeStamp) {
        const time = this.resources.get<Time>("time")!;
        const timestamp_s = timestamp / 1000;
        time.delta = timestamp_s - time.current;
        time.current = timestamp_s;

        const commands = this.resources.get<Commands>("commands")!;

        commands.playback();
        this.updateSystems(PreUpdate);

        commands.playback();
        this.updateSystems(Update);

        commands.playback();
        this.updateSystems(PostUpdate);

        commands.playback();
        this.updateSystems(Render);

        commands.playback();

        requestAnimationFrame(this.update);
    }

    private updateSystems(schedule: Schedule) {
        const systems = this.systems.get(schedule);
        systems?.forEach(system => {
            if (!system.query) {
                system.run();
            } else {
                // TODO: Cache queries

                const resources = new Resources(this.resources, system.query?.resources);

                const chunks = this.entities.getChunks(system.query);

                const archetype = new Set(system.query.all);
                const entities = new EntityIterator(archetype, chunks);

                system.run({ resources, entities });
            }
        })
    }
}


