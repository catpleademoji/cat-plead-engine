export type ComponentAccess = {
    [key: string]: unknown;
};
export type ComponentAccessRecord = {
    chunkIndex: number;
    rowIndex: number;
};
export declare const accessMap: WeakMap<ComponentAccess, ComponentAccessRecord>;
