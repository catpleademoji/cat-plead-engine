import { Schedule } from "./Schedule";
import { System } from "./System";
import { SystemGroup } from "./SystemGroup";

export class SystemManager {
    private systemGroups: Map<Schedule, SystemGroup[]>;
    private defaultSystemGroups: Map<Schedule, SystemGroup>;

    constructor() {
        this.systemGroups = new Map<Schedule, SystemGroup[]>();
        this.defaultSystemGroups = new Map<Schedule, SystemGroup>();
    }

    add(schedule: Schedule, system: System) {
        let defaultSystemGroup = this.defaultSystemGroups.get(schedule);
        if (!defaultSystemGroup) {
            defaultSystemGroup = {
                systems: [system],
                canRun: () => true,
            };
            this.defaultSystemGroups.set(schedule, defaultSystemGroup);
            const systemGroups = this.systemGroups.get(schedule);
            if (systemGroups) {
                this.systemGroups.set(schedule, [defaultSystemGroup, ...systemGroups])
            } else {
                this.systemGroups.set(schedule, [defaultSystemGroup]);
            }
        } else {
            defaultSystemGroup.systems.push(system);
        }
    }

    addGroup(schedule: Schedule, systemGroup: SystemGroup) {
        let systemGroups = this.systemGroups.get(schedule);
        if (!systemGroups) {
            systemGroups = [];
            this.systemGroups.set(schedule, systemGroups);
        }
        systemGroups.push(systemGroup);
    }

    get(schedule: Schedule): SystemGroup[] | undefined {
        return this.systemGroups.get(schedule);
    }

    getAll(): SystemGroup[] {
        return [...this.systemGroups.values()].flat()
    }

    getDefaultSystemGroup(schedule: Schedule): SystemGroup | undefined {
        return this.defaultSystemGroups.get(schedule);
    }

    remove(schedule: Schedule, systemGroup: SystemGroup, system: System) {
        const systemGroups = this.systemGroups.get(schedule)!;
        const group = systemGroups.find(group => group === systemGroup);
        if (group) {
            group.systems = group.systems.filter(x => x === system);
        }
    }

    removeSystems(schedule: Schedule) {
        this.systemGroups.set(schedule, []);
    }
}
