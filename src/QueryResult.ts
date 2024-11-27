import { accessMap, ComponentAccess } from "./ComponentAccess";
import { Archetype } from "./Archetype";
import { Chunk } from "./Chunk";
import { Entity } from "./Entity";
import { Resources } from "./Resources";

export type QueryResult = {
  resources: Resources;
  entities: EntityIterator;
};


export type EntityForeachCallbackFunc = (components: ComponentAccess, entity: Entity) => void;

export class EntityIterator {
  private chunks: Chunk[];
  private componentAccess: ComponentAccess;

  constructor(archetype: Archetype, chunks: Chunk[]) {
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
      })
    })
  }

  foreach(func: EntityForeachCallbackFunc) {
    for (let chunkIndex = 0; chunkIndex < this.chunks.length; chunkIndex++) {
      const chunk = this.chunks[chunkIndex];
      const record = accessMap.get(this.componentAccess)!;
      record.chunkIndex = chunkIndex;
      chunk.foreach(this.componentAccess, (componentAccess: ComponentAccess, entity: Entity) => {
        func(componentAccess, entity);
      })
    }
  }
};
