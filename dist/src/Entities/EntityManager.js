import { Chunk } from "./Chunk";
import { InvalidEntityError } from "../Errors";
export class EntityManager {
    constructor() {
        this.entities = [];
        this.freeEntities = [];
        const emptyArchetype = { id: 0, components: new Set() };
        this.archetypes = [emptyArchetype];
        this.chunks = [new Chunk(emptyArchetype)];
        this.archetypeChunkMap = new Map();
        this.archetypeChunkMap.set(0, [0]);
        this.newArchetypes = [];
        this.count = 0;
    }
    clear() {
        this.count = 0;
        this.chunks.forEach(chunk => {
            chunk.clear();
        });
    }
    exists(entity) {
        if (!entity) {
            return false;
        }
        if (entity.index < 0 || entity.index >= this.entities.length) {
            return false;
        }
        const record = this.entities[entity.index];
        if (!record) {
            return false;
        }
        if (record.version != entity.version) {
            return false;
        }
        return true;
    }
    spawnEmpty() {
        // zero is the index of the empty archetype chunk
        const chunkIndex = 0;
        const newEntity = this.getEntity();
        const row = this.chunks[chunkIndex].add(newEntity, {});
        const newRecord = {
            version: newEntity.version,
            chunkIndex: chunkIndex,
            rowIndex: row,
        };
        this.entities[newEntity.index] = newRecord;
        return newEntity;
    }
    spawnFromEntity(entity) {
        if (!this.exists(entity)) {
            throw new InvalidEntityError();
        }
        const record = this.entities[entity.index];
        const newEntity = this.getEntity();
        const row = this.chunks[record.chunkIndex].clone(record.rowIndex, newEntity);
        const newRecord = {
            version: newEntity.version,
            chunkIndex: record.chunkIndex,
            rowIndex: row,
        };
        this.entities[newEntity.index] = newRecord;
        return newEntity;
    }
    spawnFromComponents(components) {
        const archetype = new Set(Object.keys(components));
        const chunkIndex = this.getChunk(archetype);
        const newEntity = this.getEntity();
        const row = this.chunks[chunkIndex].add(newEntity, components);
        const newRecord = {
            version: newEntity.version,
            chunkIndex: chunkIndex,
            rowIndex: row,
        };
        this.entities[newEntity.index] = newRecord;
        return newEntity;
    }
    addComponent(entity, components) {
        if (!this.exists(entity)) {
            throw new InvalidEntityError();
        }
        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];
        if (Array.isArray(components)) {
            if (components.every(component => chunk.archetype.components.has(component))) {
                return;
            }
        }
        else if (chunk.archetype.components.has(components)) {
            return;
        }
        const archetype = new Set(chunk.archetype.components);
        if (Array.isArray(components)) {
            components.forEach(component => archetype.add(component));
        }
        else {
            archetype.add(components);
        }
        const newChunkIndex = this.getChunk(archetype);
        this.moveChunk(entity, newChunkIndex);
    }
    setComponent(entity, components, value) {
        if (typeof components === "string") {
            if (!this.hasComponent(entity, components)) {
                this.addComponent(entity, components);
            }
            const record = this.entities[entity.index];
            const chunk = this.chunks[record.chunkIndex];
            chunk.setComponent(record.rowIndex, components, value);
        }
        else {
            this.addComponent(entity, Object.keys(components));
            const record = this.entities[entity.index];
            const chunk = this.chunks[record.chunkIndex];
            Object.entries(components).forEach(([component, value]) => {
                chunk.setComponent(record.rowIndex, component, value);
            });
        }
    }
    removeComponent(entity, components) {
        if (!this.exists(entity)) {
            throw new InvalidEntityError();
        }
        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];
        if (Array.isArray(components)) {
            if (!components.every(component => chunk.archetype.components.has(component))) {
                return;
            }
        }
        else {
            if (!chunk.archetype.components.has(components)) {
                return;
            }
        }
        const archetype = new Set(chunk.archetype.components);
        if (Array.isArray(components)) {
            components.forEach(component => archetype.delete(component));
        }
        else {
            archetype.delete(components);
        }
        const newChunkIndex = this.getChunk(archetype);
        this.moveChunk(entity, newChunkIndex);
    }
    moveChunk(entity, newChunkIndex) {
        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];
        const newChunk = this.chunks[newChunkIndex];
        // copies entity component values to the other chunk
        const newChunkRow = chunk.copyTo(record.rowIndex, newChunk);
        // remove the entity from old chunk
        const movedEntity = chunk.remove(record.rowIndex);
        // update records for the entity and the moved entity 
        const movedRecord = this.entities[movedEntity.index];
        this.entities[movedEntity.index] = {
            version: movedRecord.version,
            chunkIndex: movedRecord.chunkIndex,
            rowIndex: record.rowIndex,
        };
        this.entities[entity.index] = {
            version: record.version,
            chunkIndex: newChunkIndex,
            rowIndex: newChunkRow,
        };
    }
    hasComponent(entity, component) {
        if (!this.exists(entity)) {
            throw new InvalidEntityError();
        }
        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];
        return chunk.archetype.components.has(component);
    }
    getEntity() {
        let freeEntityIndex = this.freeEntities.shift();
        let entity;
        if (freeEntityIndex === undefined) {
            // create a fresh entity, appending it to list
            entity = {
                index: this.entities.length,
                version: 0,
            };
        }
        else {
            // reuse an old entity
            const lastVersion = this.entities[freeEntityIndex].version;
            entity = {
                index: freeEntityIndex,
                version: lastVersion,
            };
        }
        this.count++;
        return entity;
    }
    getChunk(archetype) {
        const archetypeIndex = this.getOrAddArchetype(archetype);
        let chunkIndices = this.archetypeChunkMap.get(archetypeIndex);
        if (!chunkIndices) {
            chunkIndices = [];
            this.archetypeChunkMap.set(archetypeIndex, chunkIndices);
        }
        let chunkIndex = chunkIndices.find(x => this.chunks[x]);
        if (chunkIndex === undefined) {
            chunkIndex = this.chunks.length;
            const newChunk = new Chunk({ id: chunkIndex, components: archetype });
            this.chunks.push(newChunk);
            chunkIndices.push(chunkIndex);
        }
        return chunkIndex;
    }
    getOrAddArchetype(archetype) {
        let archetypeIndex = this.archetypes.findIndex(x => {
            if (archetype.size !== x.components.size) {
                return false;
            }
            for (const component of x.components) {
                if (!archetype.has(component)) {
                    return false;
                }
            }
            for (const component of archetype) {
                if (!x.components.has(component)) {
                    return false;
                }
            }
            return true;
        });
        if (archetypeIndex === -1) {
            archetypeIndex = this.archetypes.length;
            this.newArchetypes.push({ id: archetypeIndex, components: archetype });
            this.archetypes.push({ id: archetypeIndex, components: archetype });
        }
        return archetypeIndex;
    }
    destroyEntity(entity) {
        if (this.count === 0) {
            return false;
        }
        if (!this.exists(entity)) {
            return false;
        }
        const record = this.entities[entity.index];
        // remove performs a swapback removal and returns the entity that swapped
        // with the deleted entity. We must update the moved entity's row index.
        const movedEntity = this.chunks[record.chunkIndex].remove(record.rowIndex);
        const movedRecord = this.entities[movedEntity.index];
        this.entities[movedEntity.index] = {
            version: movedRecord.version,
            chunkIndex: movedRecord.chunkIndex,
            rowIndex: record.rowIndex,
        };
        this.entities[entity.index] = {
            version: record.version + 1,
            chunkIndex: 0,
            rowIndex: 0,
        };
        this.freeEntities.push(entity.index);
        this.count--;
        return true;
    }
    getChunks(query) {
        if (!query.all && !query.any && !query.none) {
            return [];
        }
        const matchedArchetypes = this.archetypes.filter(archetype => {
            var _a, _b;
            const matchedAll = (_a = query.all) === null || _a === void 0 ? void 0 : _a.every(component => archetype.components.has(component));
            if (matchedAll === false) {
                return false;
            }
            const matchedNone = (_b = query.none) === null || _b === void 0 ? void 0 : _b.every(component => !archetype.components.has(component));
            if (matchedNone === false) {
                return false;
            }
            return true;
        });
        return matchedArchetypes
            .map(archetype => {
            const chunkIndices = this.archetypeChunkMap.get(archetype.id);
            return chunkIndices.map(chunkId => this.chunks[chunkId]);
        })
            .flat();
    }
    getArchetype(entity) {
        if (!this.exists(entity)) {
            throw new InvalidEntityError();
        }
        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];
        return [...chunk.archetype.components];
    }
    getComponent(entity, component) {
        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];
        if (!chunk.hasComponent(component)) {
            return;
        }
        return chunk.getComponent(record.rowIndex, component);
    }
    getNewArchetypes() {
        return this.newArchetypes.map(record => {
            return this.archetypes[record.id];
        });
    }
    clearNewArchetypes() {
        this.newArchetypes.length = 0;
    }
}
