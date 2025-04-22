import { ComponentValueMap } from "./Entities/ComponentValueMap";
import { EntityManager } from "./Entities/EntityManager";
import { Entity } from "./Entities/Entity";
import { Component } from "./Queries/Query";
export interface Command {
    playback(entityManager: EntityManager): void;
}
export declare class Commands {
    private entityManager;
    private commands;
    constructor(entityManager: EntityManager);
    spawnEmpty(): void;
    spawnFromEntity(entity: Entity): void;
    spawnFromComponents(components: ComponentValueMap): void;
    addComponent(entity: Entity, component: Component): void;
    setComponent(entity: Entity, component: Component, value: unknown): void;
    removeComponent(entity: Entity, component: Component): void;
    destroyEntity(entity: Entity): void;
    playback(): void;
    addCommand(command: Command): void;
}
