import { ResourceManager } from "../Resources/ResourceManager";
import { System } from "./System";
export type SystemGroup = {
    systems: System[];
    resetSystems?: () => void;
    canRun(resources: ResourceManager): boolean;
};
