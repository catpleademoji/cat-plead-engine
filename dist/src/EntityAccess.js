import { accessMap } from "./ComponentAccess";
import { EntityManager } from "./EntityManager";
export class EntityAccess {
    constructor(entityManager, archetype, chunks) {
        this.entityManager = new EntityManager();
        this.entityManager = entityManager;
        this.chunks = chunks;
        this.componentAccess = {};
        accessMap.set(this.componentAccess, { chunkIndex: 0, rowIndex: 0 });
        archetype.forEach(component => {
            Object.defineProperty(this.componentAccess, component, {
                get() {
                    const record = accessMap.get(this);
                    return chunks[record.chunkIndex].getComponent(record.rowIndex, component);
                },
                set(value) {
                    const record = accessMap.get(this);
                    chunks[record.chunkIndex].setComponent(record.rowIndex, component, value);
                }
            });
        });
    }
    foreach(func) {
        for (let chunkIndex = 0; chunkIndex < this.chunks.length; chunkIndex++) {
            const chunk = this.chunks[chunkIndex];
            const record = accessMap.get(this.componentAccess);
            record.chunkIndex = chunkIndex;
            chunk.foreach(this.componentAccess, (componentAccess, entity) => {
                func(componentAccess, entity);
            });
        }
    }
    count() {
        return this.chunks.reduce((sum, chunk) => sum + chunk.count, 0);
    }
    getComponent(entity, component) {
        return this.entityManager.getComponent(entity, component);
    }
    setComponent(entity, component, value) {
        this.entityManager.setComponent(entity, component, value);
    }
}
