import { Archetype } from "./Archetype";
import { Chunk } from "./Chunk";
import { ComponentAccess } from "./ComponentAccess";
import { Entity } from "./Entity";
import { EntityManager } from "./EntityManager";
import { Component } from "./Query";
export type EntityForeachCallbackFunc = (components: ComponentAccess, entity: Entity) => void;
export declare class EntityAccess {
    private entityManager;
    private chunks;
    private componentAccess;
    constructor(entityManager: EntityManager, archetype: Archetype, chunks: Chunk[]);
    foreach(func: EntityForeachCallbackFunc): void;
    count(): number;
    getComponent<ComponentType>(entity: Entity, component: Component): ComponentType;
    setComponent(entity: Entity, component: Component, value: unknown): void;
}
