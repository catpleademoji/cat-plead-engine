import { Resources } from "../Resources/Resources";
import { EntityAccess } from "../Entities/EntityAccess";
export type QueryResult = {
    resources: Resources;
    entities: EntityAccess;
};
