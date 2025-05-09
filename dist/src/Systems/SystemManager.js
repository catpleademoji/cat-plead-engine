export class SystemManager {
    constructor() {
        // this.systems = new Map<Schedule, System[]>();
        this.systemGroups = new Map();
        this.defaultSystemGroups = new Map();
    }
    add(schedule, system) {
        let defaultSystemGroup = this.defaultSystemGroups.get(schedule);
        if (!defaultSystemGroup) {
            defaultSystemGroup = {
                systems: [system],
                canRun: () => true,
            };
            this.defaultSystemGroups.set(schedule, defaultSystemGroup);
            this.systemGroups.set(schedule, [defaultSystemGroup]);
        }
        else {
            defaultSystemGroup.systems.push(system);
        }
    }
    addGroup(schedule, systemGroup) {
        let systemGroups = this.systemGroups.get(schedule);
        if (!systemGroups) {
            systemGroups = [];
            this.systemGroups.set(schedule, systemGroups);
        }
        systemGroups.push(systemGroup);
    }
    get(schedule) {
        return this.systemGroups.get(schedule);
    }
    getAll() {
        return [...this.systemGroups.values()].flat();
    }
    remove(schedule, systemGroup, system) {
        const systemGroups = this.systemGroups.get(schedule);
        const group = systemGroups.find(group => group === systemGroup);
        if (group) {
            group.systems = group.systems.filter(x => x === system);
        }
    }
    removeSystems(schedule) {
        this.systemGroups.set(schedule, []);
    }
}
