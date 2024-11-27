import { Component } from "./Query";

export type Archetype = Set<Component>;

export type ArchetypeRecord = {
    id: number;
    components: Archetype;
}