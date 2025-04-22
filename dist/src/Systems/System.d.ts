import { Query } from "../Queries/Query";
import { QueryResult } from "../Queries/QueryResult";
export type System = {
    query?: Query;
    run(queryResult?: QueryResult): void;
};
