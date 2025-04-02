import { Resources } from "./Resources";
import { EntityAccess } from "./EntityAccess";

export type QueryResult = {
    resources: Resources;
    entities: EntityAccess;
};
