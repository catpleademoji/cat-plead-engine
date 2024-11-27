import { Schedule } from "./Schedule";
import { System } from "./System";

export class SystemManager {
    private systems: Map<string, System[]>;

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
}
