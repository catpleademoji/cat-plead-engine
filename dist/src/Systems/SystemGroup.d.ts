import { ResourceManager } from "../Resources/ResourceManager";
import { System } from "./System";
export type SystemGroup = {
    systems: System[];
    canRun(resources: ResourceManager): boolean;
};
