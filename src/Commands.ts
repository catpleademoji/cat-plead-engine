import { ComponentValueMap } from "./Entities/ComponentValueMap";
import { EntityManager } from "./Entities/EntityManager";
import { Entity } from "./Entities/Entity";
import { Component } from "./Queries/Query";

export interface Command {
    playback(entityManager: EntityManager): void;
}

class SpawnEmpty implements Command {
    playback(entityManager: EntityManager) {
        entityManager.spawnEmpty();
    }
}

class SpawnFromEntity implements Command {
    entity: Entity;

    constructor(entity: Entity) {
        this.entity = entity;
    }

    playback(entityManager: EntityManager) {
        entityManager.spawnFromEntity(this.entity);
    }
}

class SpawnFromComponents implements Command {
    components: ComponentValueMap;

    constructor(components: ComponentValueMap) {
        this.components = components;
    }

    playback(entityManager: EntityManager) {
        entityManager.spawnFromComponents(this.components);
    }
}

class AddComponent implements Command {
    entity: Entity;
    component: Component | Component[];

    constructor(entity: Entity, component: Component | Component[]) {
        this.entity = entity;
        this.component = component;
    }

    playback(entityManager: EntityManager): void {
        entityManager.addComponent(this.entity, this.component);
    }
}

class SetComponent implements Command {
    entity: Entity;
    component: Component | ComponentValueMap;
    value?: unknown;

    constructor(entity: Entity, component: Component, value: unknown);
    constructor(entity: Entity, componentValues: ComponentValueMap);
    constructor(entity: Entity, component: Component | ComponentValueMap, value?: unknown) {
        this.entity = entity;
        this.component = component;
        this.value = value;
    }

    playback(entityManager: EntityManager): void {
        entityManager.setComponent(this.entity, this.component, this.value);
    }
}

class RemoveComponent implements Command {
    entity: Entity;
    component: Component | Component[];

    constructor(entity: Entity, component: Component | Component[]) {
        this.entity = entity;
        this.component = component;
    }

    playback(entityManager: EntityManager): void {
        entityManager.removeComponent(this.entity, this.component);
    }
}

class DestroyEntity implements Command {
    entity: Entity;

    constructor(entity: Entity) {
        this.entity = entity;
    }

    playback(entityManager: EntityManager): void {
        entityManager.destroyEntity(this.entity);
    }
}

export class Commands {
    private entityManager: EntityManager;
    private commands: Command[];

    constructor(entityManager: EntityManager) {
        this.entityManager = entityManager;
        this.commands = [];
    }

    spawnEmpty() {
        this.commands.push(new SpawnEmpty());
    }

    spawnFromEntity(entity: Entity) {
        this.commands.push(new SpawnFromEntity(entity));
    }

    spawnFromComponents(components: ComponentValueMap) {
        this.commands.push(new SpawnFromComponents(components));
    }

    addComponent(entity: Entity, component: Component) {
        this.commands.push(new AddComponent(entity, component));
    }

    setComponent(entity: Entity, component: Component, value: unknown) {
        this.commands.push(new SetComponent(entity, component, value));
    }

    removeComponent(entity: Entity, component: Component) {
        this.commands.push(new RemoveComponent(entity, component));
    }

    destroyEntity(entity: Entity) {
        this.commands.push(new DestroyEntity(entity));
    }

    playback() {
        let command = this.commands.shift();
        while (command) {
            command.playback(this.entityManager);
            command = this.commands.shift();
        }
    }

    addCommand(command: Command) {
        this.commands.push(command);
    }
}
