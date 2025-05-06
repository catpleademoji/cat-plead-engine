import { accessMap } from "./ComponentAccess";
export class Chunk {
    constructor(archetype) {
        this.archetype = archetype;
        this._entities = [];
        this._count = 0;
        this._componentTable = new Map();
        archetype.components.forEach(component => this._componentTable.set(component, []));
    }
    get count() {
        return this._count;
    }
    add(entity, components) {
        const row = this._count;
        // appends the entity 
        this._entities[row] = {
            index: entity.index,
            version: entity.version,
        };
        this.archetype.components.forEach(component => {
            const column = this._componentTable.get(component);
            column[row] = components[component];
        });
        this._count++;
        return row;
    }
    clone(index, entity) {
        const row = this._count;
        // appends the entity 
        this._entities[row] = {
            index: entity.index,
            version: entity.version
        };
        this.archetype.components.forEach(component => {
            const column = this._componentTable.get(component);
            column[row] = column[index];
        });
        this._count++;
        return row;
    }
    remove(index) {
        const row = this._count - 1;
        // remove by swapping with last element and decrementing count
        this._entities[index] = {
            index: this._entities[row].index,
            version: this._entities[row].version
        };
        this.archetype.components.forEach(component => {
            const column = this._componentTable.get(component);
            column[index] = column[row];
        });
        this._count--;
        return this._entities[row];
    }
    copyTo(index, chunk) {
        const row = chunk._count;
        chunk._entities[row] = this._entities[index];
        chunk.archetype.components.forEach(component => {
            const fromColumn = this._componentTable.get(component);
            const toColumn = chunk._componentTable.get(component);
            if (fromColumn) {
                toColumn[row] = fromColumn[index];
            }
            else {
                toColumn[row] = undefined;
            }
        });
        chunk._count++;
        return row;
    }
    hasComponent(component) {
        return this._componentTable.has(component);
    }
    setComponent(index, component, value) {
        const column = this._componentTable.get(component);
        column[index] = value;
    }
    getComponent(index, component) {
        return this._componentTable.get(component)[index];
    }
    getEntity(index) {
        return this._entities[index];
    }
    foreach(componentAccess, func) {
        const record = accessMap.get(componentAccess);
        for (let i = 0; i < this._count; i++) {
            record.rowIndex = i;
            func(componentAccess, this._entities[i]);
        }
    }
}
