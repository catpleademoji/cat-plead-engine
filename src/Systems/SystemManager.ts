import { Schedule } from "./Schedule";
import { System } from "./System";

export class SystemManager {
    private systems: Map<Schedule, System[]>;

    constructor() {
        this.systems = new Map<Schedule, System[]>();
    }

    add(schedule: Schedule, system: System) {
        let systems = this.systems.get(schedule);
        if (!systems) {
            systems = [];
            this.systems.set(schedule, systems);
        }
        systems.push(system);
    }

    get(schedule: Schedule): System[] | undefined {
        return this.systems.get(schedule);
    }

    getAll(): System[] {
        return [...this.systems.values()].flat()
    }

    remove(schedule: Schedule, system: System) {
        const systems = this.systems.get(schedule)!;
        const filteredSystems = systems.filter(x => x === system);
        this.systems.set(schedule, filteredSystems);
    }

    removeSystems(schedule: Schedule) {
        this.systems.set(schedule, []);
    }
}
