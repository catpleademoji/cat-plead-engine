import { ComponentValueMap } from "./ComponentValueMap";
import { Archetype, ArchetypeRecord } from "./Archetype";
import { Entity } from "./Entity";
import { Component } from "./Query";
import { EntityForeachCallbackFunc } from "./QueryResult";
import { accessMap, ComponentAccess } from "./ComponentAccess";

export class Chunk {
    readonly archetype: ArchetypeRecord;
    private entities: Entity[];
    private componentTable: Map<Component, unknown[]>;
    private count: number;

    constructor(archetype: ArchetypeRecord) {
        this.archetype = archetype;
        this.entities = [];
        this.count = 0;

        this.componentTable = new Map<Component, unknown[]>();
        archetype.components.forEach(component => this.componentTable.set(component, []));
    }

    add(entity: Entity, components: ComponentValueMap): number {
        const row = this.count;

        // appends the entity 
        this.entities[row] = entity;
        this.archetype.components.forEach(component => {
            const column = this.componentTable.get(component)!;
            column[row] = components[component];
        });

        this.count++;
        return row;
    }

    clone(index: number, entity: Entity): number {
        const row = this.count;

        // appends the entity 
        this.entities[row] = entity;
        this.archetype.components.forEach(component => {
            const column = this.componentTable.get(component)!;
            column[row] = column[index];
        });

        this.count++;
        return row;
    }

    remove(index: number): Entity {
        const row = this.count - 1;

        // remove by swapping with last element and decrementing count
        this.entities[index] = this.entities[row];
        this.archetype.components.forEach(component => {
            const column = this.componentTable.get(component)!;
            column[index] = column[row];
        });

        this.count--;
        return this.entities[row];
    }

    move(index: number, chunk: Chunk): number {
        const row = chunk.count;
        chunk.entities.push(this.entities[index]);

        chunk.archetype.components.forEach(component => {
            const fromColumn = this.componentTable.get(component);
            const toColumn = chunk.componentTable.get(component)!;

            if (fromColumn) {
                toColumn[row] = fromColumn[index];
            } else {
                toColumn[row] = undefined;
            }
        });

        chunk.count++;

        return row;
    }

    setComponent(index: number, component: string, value: unknown) {
        const column = this.componentTable.get(component)!;
        column[index] = value;
    }

    getComponent(index: number, component: string) {
        return this.componentTable.get(component)![index];
    }

    getEntity(index: number) {
        return this.entities[index];
    }

    foreach(componentAccess: ComponentAccess, func: EntityForeachCallbackFunc) {
        const record = accessMap.get(componentAccess)!;
        for (let i = 0; i < this.count; i++) {
            record.rowIndex = i;
            func(componentAccess, this.entities[i]);
        }
    }
}
