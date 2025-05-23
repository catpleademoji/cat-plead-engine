import { ArchetypeRecord } from "./Archetype";
import { Chunk } from "./Chunk";
import { ComponentValueMap } from "./ComponentValueMap";
import { Entity } from "./Entity";
import { Component, Query } from "../Queries/Query";
export declare class EntityManager {
    private entities;
    private archetypes;
    private archetypeChunkMap;
    private chunks;
    private count;
    private newArchetypes;
    private freeEntities;
    constructor();
    clear(): void;
    exists(entity: Entity | null): boolean;
    spawnEmpty(): Entity;
    spawnFromEntity(entity: Entity): Entity;
    spawnFromComponents(components: ComponentValueMap): Entity;
    addComponent(entity: Entity, components: Component | Component[]): void;
    setComponent(entity: Entity, components: Component | ComponentValueMap, value?: unknown): void;
    removeComponent(entity: Entity, components: Component | Component[]): void;
    moveChunk(entity: Entity, newChunkIndex: number): void;
    hasComponent(entity: Entity, component: Component): boolean;
    private getEntity;
    private getChunk;
    private getOrAddArchetype;
    destroyEntity(entity: Entity): boolean;
    getChunks(query: Query): Chunk[];
    getArchetype(entity: Entity): Component[];
    getComponent(entity: Entity, component: Component): unknown | undefined;
    getNewArchetypes(): ReadonlyArray<ArchetypeRecord>;
    clearNewArchetypes(): void;
}
