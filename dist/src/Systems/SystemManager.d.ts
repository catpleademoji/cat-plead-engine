import { Schedule } from "./Schedule";
import { System } from "./System";
import { SystemGroup } from "./SystemGroup";
export declare class SystemManager {
    private systemGroups;
    private defaultSystemGroups;
    constructor();
    add(schedule: Schedule, system: System): void;
    addGroup(schedule: Schedule, systemGroup: SystemGroup): void;
    get(schedule: Schedule): SystemGroup[] | undefined;
    getAll(): SystemGroup[];
    remove(schedule: Schedule, systemGroup: SystemGroup, system: System): void;
    removeSystems(schedule: Schedule): void;
}
