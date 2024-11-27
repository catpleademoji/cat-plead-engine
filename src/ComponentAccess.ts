export type ComponentAccess = {
    [key: string]: unknown;
  }
  
  export type ComponentAccessRecord = {
    chunkIndex: number;
    rowIndex: number;
  };

export const accessMap = new WeakMap<ComponentAccess, ComponentAccessRecord>();
