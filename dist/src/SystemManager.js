export class SystemManager {
    constructor() {
        this.systems = new Map();
    }
    add(schedule, system) {
        let systems = this.systems.get(schedule);
        if (!systems) {
            systems = [];
            this.systems.set(schedule, systems);
        }
        systems.push(system);
    }
    get(schedule) {
        return this.systems.get(schedule);
    }
    getAll() {
        return [...this.systems.values()].flat();
    }
}
