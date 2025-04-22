import { Schedule } from "./Schedule";
import { System } from "./System";
export declare class SystemManager {
    private systems;
    constructor();
    add(schedule: Schedule, system: System): void;
    get(schedule: Schedule): System[] | undefined;
    getAll(): System[];
    remove(schedule: Schedule, system: System): void;
    removeSystems(schedule: Schedule): void;
}
