import { ComponentAccess } from "./ComponentAccess";
import { Entity } from "./Entity";
import { Resources } from "./Resources";
import { EntityAccess } from "./EntityAccess";

export type QueryResult = {
  resources: Resources;
  entities: EntityAccess;
};
