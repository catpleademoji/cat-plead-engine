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
    remove(schedule, system) {
        const systems = this.systems.get(schedule);
        const filteredSystems = systems.filter(x => x === system);
        this.systems.set(schedule, filteredSystems);
    }
    removeSystems(schedule) {
        this.systems.set(schedule, []);
    }
}
