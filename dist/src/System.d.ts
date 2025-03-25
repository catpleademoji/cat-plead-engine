import { Query } from "./Query";
import { QueryResult } from "./QueryResult";
export type System = {
    query?: Query;
    run(queryResult?: QueryResult): void;
};
