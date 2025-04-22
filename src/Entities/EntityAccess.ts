import { Archetype } from "./Archetype";
import { Chunk } from "./Chunk";
import { ComponentAccess, accessMap } from "./ComponentAccess";
import { Entity } from "./Entity";
import { EntityManager } from "./EntityManager";
import { Component } from "../Queries/Query";

export type EntityForeachCallbackFunc = (components: ComponentAccess, entity: Entity) => void;

export class EntityAccess {
    private entityManager: EntityManager = new EntityManager();
    private chunks: Chunk[];
    private componentAccess: ComponentAccess;

    constructor(entityManager: EntityManager, archetype: Archetype, chunks: Chunk[]) {
        this.entityManager = entityManager;
        this.chunks = chunks;

        this.componentAccess = {};
        accessMap.set(this.componentAccess, { chunkIndex: 0, rowIndex: 0 });
        archetype.forEach(component => {
            Object.defineProperty(this.componentAccess, component, {
                get() {
                    const record = accessMap.get(this)!;
                    return chunks[record.chunkIndex].getComponent(record.rowIndex, component);
                },
                set(value: unknown) {
                    const record = accessMap.get(this)!;
                    chunks[record.chunkIndex].setComponent(record.rowIndex, component, value);
                }
            });
        });
    }

    foreach(func: EntityForeachCallbackFunc) {
        for (let chunkIndex = 0; chunkIndex < this.chunks.length; chunkIndex++) {
            const chunk = this.chunks[chunkIndex];
            const record = accessMap.get(this.componentAccess)!;
            record.chunkIndex = chunkIndex;
            chunk.foreach(this.componentAccess, (componentAccess: ComponentAccess, entity: Entity) => {
                func(componentAccess, entity);
            });
        }
    }

    count() {
        return this.chunks.reduce((sum, chunk) => sum + chunk.count, 0);
    }

    getComponent<ComponentType>(entity: Entity, component: Component) {
        return this.entityManager.getComponent(entity, component) as ComponentType;
    }

    setComponent(entity: Entity, component: Component, value: unknown) {
        this.entityManager.setComponent(entity, component, value);
    }
}
