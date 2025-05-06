import { ComponentValueMap } from "./ComponentValueMap";
import { ArchetypeRecord } from "./Archetype";
import { Entity } from "./Entity";
import { Component } from "../Queries/Query";
import { EntityForeachCallbackFunc } from "./EntityAccess";
import { ComponentAccess } from "./ComponentAccess";
export declare class Chunk {
    readonly archetype: ArchetypeRecord;
    private _entities;
    private _componentTable;
    private _count;
    constructor(archetype: ArchetypeRecord);
    get count(): number;
    add(entity: Entity, components: ComponentValueMap): number;
    clone(index: number, entity: Entity): number;
    remove(index: number): Entity;
    copyTo(index: number, chunk: Chunk): number;
    hasComponent(component: Component): boolean;
    setComponent(index: number, component: Component, value: unknown): void;
    getComponent(index: number, component: Component): unknown;
    getEntity(index: number): Entity;
    foreach(componentAccess: ComponentAccess, func: EntityForeachCallbackFunc): void;
}
