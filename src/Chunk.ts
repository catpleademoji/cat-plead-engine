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
    private _count: number;

    constructor(archetype: ArchetypeRecord) {
        this.archetype = archetype;
        this.entities = [];
        this._count = 0;

        this.componentTable = new Map<Component, unknown[]>();
        archetype.components.forEach(component => this.componentTable.set(component, []));
    }

    get count() {
        return this._count;
    }

    add(entity: Entity, components: ComponentValueMap): number {
        const row = this._count;

        // appends the entity 
        this.entities[row] = entity;
        this.archetype.components.forEach(component => {
            const column = this.componentTable.get(component)!;
            column[row] = components[component];
        });

        this._count++;
        return row;
    }

    clone(index: number, entity: Entity): number {
        const row = this._count;

        // appends the entity 
        this.entities[row] = entity;
        this.archetype.components.forEach(component => {
            const column = this.componentTable.get(component)!;
            column[row] = column[index];
        });

        this._count++;
        return row;
    }

    remove(index: number): Entity {
        const row = this._count - 1;

        // remove by swapping with last element and decrementing count
        this.entities[index] = this.entities[row];
        this.archetype.components.forEach(component => {
            const column = this.componentTable.get(component)!;
            column[index] = column[row];
        });

        this._count--;
        return this.entities[row];
    }

    move(index: number, chunk: Chunk): number {
        const row = chunk._count;
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

        chunk._count++;

        return row;
    }

    hasComponent(component: Component) {
        return this.componentTable.has(component);
    }

    setComponent(index: number, component: Component, value: unknown) {
        const column = this.componentTable.get(component)!;
        column[index] = value;
    }

    getComponent(index: number, component: Component): unknown {
        return this.componentTable.get(component)![index];
    }

    getEntity(index: number) {
        return this.entities[index];
    }

    foreach(componentAccess: ComponentAccess, func: EntityForeachCallbackFunc) {
        const record = accessMap.get(componentAccess)!;
        for (let i = 0; i < this._count; i++) {
            record.rowIndex = i;
            func(componentAccess, this.entities[i]);
        }
    }
}
