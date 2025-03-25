class SpawnEmpty {
    playback(entityManager) {
        entityManager.spawnEmpty();
    }
}
class SpawnFromEntity {
    constructor(entity) {
        this.entity = entity;
    }
    playback(entityManager) {
        entityManager.spawnFromEntity(this.entity);
    }
}
class SpawnFromComponents {
    constructor(components) {
        this.components = components;
    }
    playback(entityManager) {
        entityManager.spawnFromComponents(this.components);
    }
}
class AddComponent {
    constructor(entity, component) {
        this.entity = entity;
        this.component = component;
    }
    playback(entityManager) {
        entityManager.addComponent(this.entity, this.component);
    }
}
class SetComponent {
    constructor(entity, component, value) {
        this.entity = entity;
        this.component = component;
        this.value = value;
    }
    playback(entityManager) {
        entityManager.setComponent(this.entity, this.component, this.value);
    }
}
class RemoveComponent {
    constructor(entity, component) {
        this.entity = entity;
        this.component = component;
    }
    playback(entityManager) {
        entityManager.removeComponent(this.entity, this.component);
    }
}
class DestroyEntity {
    constructor(entity) {
        this.entity = entity;
    }
    playback(entityManager) {
        entityManager.destroyEntity(this.entity);
    }
}
export class Commands {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.commands = [];
    }
    spawnEmpty() {
        this.commands.push(new SpawnEmpty());
    }
    spawnFromEntity(entity) {
        this.commands.push(new SpawnFromEntity(entity));
    }
    spawnFromComponents(components) {
        this.commands.push(new SpawnFromComponents(components));
    }
    addComponent(entity, component) {
        this.commands.push(new AddComponent(entity, component));
    }
    setComponent(entity, component, value) {
        this.commands.push(new SetComponent(entity, component, value));
    }
    removeComponent(entity, component) {
        this.commands.push(new RemoveComponent(entity, component));
    }
    destroyEntity(entity) {
        this.commands.push(new DestroyEntity(entity));
    }
    playback() {
        let command = this.commands.shift();
        while (command) {
            command.playback(this.entityManager);
            command = this.commands.shift();
        }
    }
    addCommand(command) {
        this.commands.push(command);
    }
}
