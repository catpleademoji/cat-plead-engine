export type Component = string;
export type Resource = string;

export type Query = {
    all?: Component[];
    any?: Component[];
    none?: Component[];
    resources?: Resource[];
};
