import { ComponentValueMap } from "./ComponentValueMap";
import { ArchetypeRecord } from "./Archetype";
import { Entity } from "./Entity";
import { Component } from "../Queries/Query";
import { EntityForeachCallbackFunc } from "./EntityAccess";
import { accessMap, ComponentAccess } from "./ComponentAccess";

export class Chunk {
    readonly archetype: ArchetypeRecord;
    private _entities: Entity[];
    private _componentTable: Map<Component, unknown[]>;
    private _count: number;

    constructor(archetype: ArchetypeRecord) {
        this.archetype = archetype;
        this._entities = [];
        this._count = 0;

        this._componentTable = new Map<Component, unknown[]>();
        archetype.components.forEach(component => this._componentTable.set(component, []));
    }

    get count() {
        return this._count;
    }

    add(entity: Entity, components: ComponentValueMap): number {
        const row = this._count;

        // appends the entity 
        this._entities[row] = {
            index: entity.index,
            version: entity.version,
        };
        this.archetype.components.forEach(component => {
            const column = this._componentTable.get(component)!;
            column[row] = components[component];
        });

        this._count++;
        return row;
    }

    clone(index: number, entity: Entity): number {
        const row = this._count;

        // appends the entity 
        this._entities[row] = {
            index: entity.index,
            version: entity.version
        };
        this.archetype.components.forEach(component => {
            const column = this._componentTable.get(component)!;
            column[row] = column[index];
        });

        this._count++;
        return row;
    }

    remove(index: number): Entity {
        const row = this._count - 1;

        // remove by swapping with last element and decrementing count
        this._entities[index] = {
            index: this._entities[row].index,
            version: this._entities[row].version
        };
        this.archetype.components.forEach(component => {
            const column = this._componentTable.get(component)!;
            column[index] = column[row];
        });

        this._count--;
        return this._entities[row];
    }

    move(index: number, chunk: Chunk): number {
        const row = chunk._count;
        chunk._entities.push(this._entities[index]);

        chunk.archetype.components.forEach(component => {
            const fromColumn = this._componentTable.get(component);
            const toColumn = chunk._componentTable.get(component)!;

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
        return this._componentTable.has(component);
    }

    setComponent(index: number, component: Component, value: unknown) {
        const column = this._componentTable.get(component)!;
        column[index] = value;
    }

    getComponent(index: number, component: Component): unknown {
        return this._componentTable.get(component)![index];
    }

    getEntity(index: number) {
        return this._entities[index];
    }

    foreach(componentAccess: ComponentAccess, func: EntityForeachCallbackFunc) {
        const record = accessMap.get(componentAccess)!;
        for (let i = 0; i < this._count; i++) {
            record.rowIndex = i;
            func(componentAccess, this._entities[i]);
        }
    }
}
