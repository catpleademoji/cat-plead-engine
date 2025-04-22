import { Component } from "../Queries/Query";

export type Archetype = Set<Component>;

export type ArchetypeRecord = {
    id: number;
    components: Archetype;
}