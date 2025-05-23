import { Archetype, ArchetypeRecord } from "./Archetype";
import { Chunk } from "./Chunk";
import { ComponentValueMap } from "./ComponentValueMap";
import { EntityRecord } from "./EntityRecord";
import { Entity } from "./Entity";
import { Component, Query } from "../Queries/Query";
import { InvalidEntityError } from "../Errors";

export class EntityManager {
    private entities: EntityRecord[];
    private archetypes: ArchetypeRecord[];
    private archetypeChunkMap: Map<number, number[]>;
    private chunks: Chunk[];
    private count: number;

    private newArchetypes: ArchetypeRecord[];

    private freeEntities: number[];

    constructor() {
        this.entities = [];
        this.freeEntities = [];

        const emptyArchetype: ArchetypeRecord = { id: 0, components: new Set() };
        this.archetypes = [emptyArchetype];
        this.chunks = [new Chunk(emptyArchetype)];
        this.archetypeChunkMap = new Map<number, number[]>();
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

    exists(entity: Entity | null): boolean {
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

    spawnEmpty(): Entity {
        // zero is the index of the empty archetype chunk
        const chunkIndex = 0;

        const newEntity = this.getEntity();
        const row = this.chunks[chunkIndex].add(newEntity, {});
        const newRecord = {
            version: newEntity.version,
            chunkIndex: chunkIndex,
            rowIndex: row,
        }
        this.entities[newEntity.index] = newRecord;

        return newEntity;
    }

    spawnFromEntity(entity: Entity): Entity {
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
        }
        this.entities[newEntity.index] = newRecord;

        return newEntity;
    }

    spawnFromComponents(components: ComponentValueMap): Entity {
        const archetype = new Set(Object.keys(components));
        const chunkIndex = this.getChunk(archetype);

        const newEntity = this.getEntity();
        const row = this.chunks[chunkIndex].add(newEntity, components);
        const newRecord = {
            version: newEntity.version,
            chunkIndex: chunkIndex,
            rowIndex: row,
        }
        this.entities[newEntity.index] = newRecord;

        return newEntity;
    }

    addComponent(entity: Entity, components: Component | Component[]) {
        if (!this.exists(entity)) {
            throw new InvalidEntityError();
        }

        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];

        if (Array.isArray(components)) {
            if (components.every(component => chunk.archetype.components.has(component))) {
                return;
            }
        } else if (chunk.archetype.components.has(components)) {
            return;
        }

        const archetype = new Set(chunk.archetype.components);
        if (Array.isArray(components)) {
            components.forEach(component => archetype.add(component));
        } else {
            archetype.add(components);
        }

        const newChunkIndex = this.getChunk(archetype);
        this.moveChunk(entity, newChunkIndex)
    }

    setComponent(entity: Entity, components: Component | ComponentValueMap, value?: unknown) {
        if (typeof components === "string") {
            if (!this.hasComponent(entity, components)) {
                this.addComponent(entity, components);
            }

            const record = this.entities[entity.index];
            const chunk = this.chunks[record.chunkIndex];
            chunk.setComponent(record.rowIndex, components, value);
        } else {
            this.addComponent(entity, Object.keys(components));
            const record = this.entities[entity.index];
            const chunk = this.chunks[record.chunkIndex];
            Object.entries(components).forEach(([component, value]) => {
                chunk.setComponent(record.rowIndex, component, value);
            })
        }
    }

    removeComponent(entity: Entity, components: Component | Component[]) {
        if (!this.exists(entity)) {
            throw new InvalidEntityError();
        }

        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];

        if (Array.isArray(components)) {
            if (!components.every(component => chunk.archetype.components.has(component))) {
                return;
            }
        } else {
            if (!chunk.archetype.components.has(components)) {
                return;
            }
        }

        const archetype = new Set(chunk.archetype.components);
        if (Array.isArray(components)) {
            components.forEach(component => archetype.delete(component));
        } else {
            archetype.delete(components);
        }

        const newChunkIndex = this.getChunk(archetype);
        this.moveChunk(entity, newChunkIndex)
    }

    moveChunk(entity: Entity, newChunkIndex: number) {
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

    hasComponent(entity: Entity, component: Component): boolean {
        if (!this.exists(entity)) {
            throw new InvalidEntityError();
        }

        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];
        return chunk.archetype.components.has(component);
    }

    private getEntity() {
        let freeEntityIndex = this.freeEntities.shift();

        let entity: Entity;
        if (freeEntityIndex === undefined) {
            // create a fresh entity, appending it to list
            entity = {
                index: this.entities.length,
                version: 0,
            };
        } else {
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

    private getChunk(archetype: Archetype) {
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

    private getOrAddArchetype(archetype: Archetype): number {
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

    destroyEntity(entity: Entity) {
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

    getChunks(query: Query): Chunk[] {
        if (!query.all && !query.any && !query.none) {
            return [];
        }

        const matchedArchetypes = this.archetypes.filter(archetype => {
            const matchedAll = query.all?.every(component => archetype.components.has(component));
            if (matchedAll === false) {
                return false;
            }

            const matchedNone = query.none?.every(component => !archetype.components.has(component));
            if (matchedNone === false) {
                return false;
            }

            return true;
        });

        return matchedArchetypes
            .map(archetype => {
                const chunkIndices = this.archetypeChunkMap.get(archetype.id)!;
                return chunkIndices.map(chunkId => this.chunks[chunkId]);
            })
            .flat();
    }

    getArchetype(entity: Entity): Component[] {
        if (!this.exists(entity)) {
            throw new InvalidEntityError();
        }

        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];

        return [...chunk.archetype.components];
    }

    getComponent(entity: Entity, component: Component): unknown | undefined {
        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];

        if (!chunk.hasComponent(component)) {
            return;
        }

        return chunk.getComponent(record.rowIndex, component);
    }

    getNewArchetypes(): ReadonlyArray<ArchetypeRecord> {
        return this.newArchetypes.map(record => {
            return this.archetypes[record.id];
        });
    }

    clearNewArchetypes() {
        this.newArchetypes.length = 0;
    }
}
