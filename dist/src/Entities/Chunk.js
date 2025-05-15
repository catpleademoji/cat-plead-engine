import { accessMap } from "./ComponentAccess";
export class Chunk {
    constructor(archetype) {
        this.archetype = archetype;
        this.entities = [];
        this._count = 0;
        this.componentTable = new Map();
        archetype.components.forEach(component => this.componentTable.set(component, []));
    }
    get count() {
        return this._count;
    }
    add(entity, components) {
        const row = this._count;
        // appends the entity 
        this.entities[row] = {
            index: entity.index,
            version: entity.version,
        };
        this.archetype.components.forEach(component => {
            const column = this.componentTable.get(component);
            column[row] = components[component];
        });
        this._count++;
        return row;
    }
    clone(index, entity) {
        const row = this._count;
        // appends the entity 
        this.entities[row] = {
            index: entity.index,
            version: entity.version
        };
        this.archetype.components.forEach(component => {
            const column = this.componentTable.get(component);
            column[row] = column[index];
        });
        this._count++;
        return row;
    }
    remove(index) {
        const row = this._count - 1;
        // remove by swapping with last element and decrementing count
        this.entities[index] = {
            index: this.entities[row].index,
            version: this.entities[row].version
        };
        this.archetype.components.forEach(component => {
            const column = this.componentTable.get(component);
            column[index] = column[row];
        });
        this._count--;
        return this.entities[row];
    }
    copyTo(index, chunk) {
        const row = chunk._count;
        chunk.entities[row] = this.entities[index];
        chunk.archetype.components.forEach(component => {
            const fromColumn = this.componentTable.get(component);
            const toColumn = chunk.componentTable.get(component);
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
        return this.componentTable.has(component);
    }
    setComponent(index, component, value) {
        const column = this.componentTable.get(component);
        column[index] = value;
    }
    getComponent(index, component) {
        return this.componentTable.get(component)[index];
    }
    getEntity(index) {
        return this.entities[index];
    }
    clear() {
        this._count = 0;
    }
    foreach(componentAccess, func) {
        const record = accessMap.get(componentAccess);
        for (let i = 0; i < this._count; i++) {
            record.rowIndex = i;
            func(componentAccess, this.entities[i]);
        }
    }
}
