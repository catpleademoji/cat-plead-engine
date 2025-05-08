export type Schedule = string;

export const Start: Schedule = "Start";
export const PreUpdate: Schedule = "PreUpdate";
export const Update: Schedule = "Update";
export const PostUpdate: Schedule = "PostUpdate";
export const Render: Schedule = "Render";
export const FixedUpdate = "FixedUpdate";

export default {
    Start,
    PreUpdate,
    Update,
    PostUpdate,
    Render,
    FixedUpdate,
} as Readonly<Record<string, Schedule>>;
