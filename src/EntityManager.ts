import { Archetype, ArchetypeRecord } from "./Archetype";
import { Chunk } from "./Chunk";
import { ComponentValueMap } from "./ComponentValueMap";
import { EntityRecord } from "./Engine";
import { Entity } from "./Entity";
import { Component, Query } from "./Query";

export class EntityManager {
    private entities: EntityRecord[];
    private archetypes: ArchetypeRecord[];
    private archetypeChunkMap: Map<number, number[]>;
    private chunks: Chunk[];
    private count: number;

    private freeEntities: number[];

    constructor() {
        this.entities = [];
        this.freeEntities = [];

        const emptyArchetype: ArchetypeRecord = { id: 0, components: new Set() };
        this.archetypes = [emptyArchetype];
        this.chunks = [new Chunk(emptyArchetype)];
        this.archetypeChunkMap = new Map<number, number[]>();
        this.archetypeChunkMap.set(0, [0]);

        this.count = 0;
    }

    exists(entity?: Entity): boolean {
        if (!entity) {
            return false;
        }

        if (entity.index <= 0 || entity.index >= this.count) {
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
        const freeEntity = this.freeEntities.pop();
        let newRecord: EntityRecord;
        let newEntity: Entity;

        // zero is the index of the empty archetype chunk
        const chunkIndex = 0;
        if (freeEntity) {
            // reuse an old entity
            const lastVersion = this.entities[freeEntity].version;
            newEntity = {
                index: freeEntity,
                version: lastVersion,
            };

            const row = this.chunks[chunkIndex].add(newEntity, {});

            newRecord = {
                version: lastVersion,
                chunkIndex: chunkIndex,
                rowIndex: row,
            };
        } else {
            // create a fresh entity, appending it to list
            newEntity = {
                index: this.count,
                version: 0,
            };

            const row = this.chunks[chunkIndex].add(newEntity, {});

            newRecord = {
                version: 0,
                chunkIndex: chunkIndex,
                rowIndex: row,
            };
        }

        this.entities[this.count] = newRecord;
        this.count++;

        return newEntity;
    }

    spawnFromEntity(entity: Entity): Entity {
        if (!this.exists(entity as Entity)) {
            return this.spawnEmpty();
        }

        const record = this.entities[entity.index];

        const freeEntity = this.freeEntities.pop();
        let newRecord: EntityRecord;
        let newEntity: Entity;

        if (freeEntity) {
            // reuse an old entity
            const lastVersion = this.entities[freeEntity].version;
            newEntity = {
                index: freeEntity,
                version: lastVersion,
            };

            const row = this.chunks[record.chunkIndex].clone(record.rowIndex, newEntity);

            newRecord = {
                version: lastVersion,
                chunkIndex: record.chunkIndex,
                rowIndex: row,
            };
        } else {
            // create a fresh entity, appending it to list
            newEntity = {
                index: this.count,
                version: 0,
            };

            const row = this.chunks[record.chunkIndex].clone(record.rowIndex, newEntity);

            newRecord = {
                version: 0,
                chunkIndex: record.chunkIndex,
                rowIndex: row,
            };
        }

        this.entities[this.count] = newRecord;
        this.count++;

        return newEntity;
    }

    spawnFromComponents(components: ComponentValueMap): Entity {
        const freeEntity = this.freeEntities.pop();
        let newRecord: EntityRecord;
        let newEntity: Entity;

        const archetype = new Set(Object.keys(components));
        const chunkIndex = this.getChunk(archetype);

        if (freeEntity) {
            // reuse an old entity
            const lastVersion = this.entities[freeEntity].version;
            newEntity = {
                index: freeEntity,
                version: lastVersion,
            };

            const row = this.chunks[chunkIndex].add(newEntity, components);

            newRecord = {
                version: lastVersion,
                chunkIndex: chunkIndex,
                rowIndex: row,
            };
        } else {
            // create a fresh entity, appending it to list
            newEntity = {
                index: this.count,
                version: 0,
            };

            const row = this.chunks[chunkIndex].add(newEntity, components);

            newRecord = {
                version: 0,
                chunkIndex: chunkIndex,
                rowIndex: row,
            };
        }

        this.count++;
        return newEntity;
    }

    addComponent(entity: Entity, component: Component) {
        if (!this.exists(entity)) {
            return;
        }

        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];

        if (chunk.archetype.components.has(component)) {
            return;
        }

        const archetype = new Set(chunk.archetype.components);
        archetype.add(component);

        const chunkIndex = this.getChunk(archetype);
        const newChunk = this.chunks[chunkIndex];

        // move only copies component values to the other chunk
        const newChunkRow = chunk.move(record.rowIndex, newChunk);
        this.entities[entity.index] = {
            version: record.version + 1,
            chunkIndex: chunkIndex,
            rowIndex: newChunkRow,
        };

        // we still have to remove the old values
        const movedEntity = this.chunks[record.chunkIndex].remove(record.rowIndex);

        const movedRecord = this.entities[movedEntity.index];
        this.entities[movedEntity.index] = {
            version: movedRecord.version,
            chunkIndex: movedRecord.chunkIndex,
            rowIndex: record.rowIndex,
        };
    }

    setComponent(entity: Entity, component: Component, value: unknown) {
        if (!this.exists(entity)) {
            return;
        }

        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];

        if (!chunk.archetype.components.has(component)) {
            this.addComponent(entity, component);
        }

        chunk.setComponent(record.rowIndex, component, value);
    }

    removeComponent(entity: Entity, component: Component) {
        if (!this.exists(entity)) {
            return;
        }

        const record = this.entities[entity.index];
        const chunk = this.chunks[record.chunkIndex];
        if (!chunk.archetype.components.has(component)) {
            return;
        }

        const archetype = new Set(chunk.archetype.components);
        archetype.delete(component);

        const chunkIndex = this.getChunk(archetype);
        const newChunk = this.chunks[chunkIndex];

        // move only copies component values to the other chunk
        const newChunkRow = chunk.move(record.rowIndex, newChunk);
        this.entities[entity.index] = {
            version: record.version + 1,
            chunkIndex: chunkIndex,
            rowIndex: newChunkRow,
        };

        // we still have to remove the old values
        const movedEntity = this.chunks[record.chunkIndex].remove(record.rowIndex);

        const movedRecord = this.entities[movedEntity.index];
        this.entities[movedEntity.index] = {
            version: movedRecord.version,
            chunkIndex: movedRecord.chunkIndex,
            rowIndex: record.rowIndex,
        };
    }

    private getChunk(archetype: Archetype) {
        const archetypeIndex = this.getOrAddArchetype(archetype);

        let chunkIndices = this.archetypeChunkMap.get(archetypeIndex);
        if (!chunkIndices) {
            chunkIndices = [];
            this.archetypeChunkMap.set(archetypeIndex, chunkIndices);
        }

        let chunkIndex = chunkIndices.find(x => x);
        let newChunk;
        if (!chunkIndex) {
            newChunk = new Chunk({ id: archetypeIndex, components: archetype });
            chunkIndex = this.chunks.length;

            this.chunks.push(newChunk);
            chunkIndices.push(chunkIndex);
        } else {
            newChunk = this.chunks[chunkIndex];
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

        this.count--;

        return true;
    }

    getChunks(query: Query): Chunk[] {
        const matchedArchetypes = this.archetypes.filter(archetype => {
            const matchedAll = query.all?.every(component => archetype.components.has(component))
                || true;
            if (!matchedAll) {
                return false;
            }

            const matchedNone = query.none?.every(component => !archetype.components.has(component))
                || true;
            if (!matchedNone) {
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
}
