export type Schedule = string;

const Start: Schedule = "Start";
const PreUpdate: Schedule = "PreUpdate";
const Update: Schedule = "Update";
const PostUpdate: Schedule = "PostUpdate";
const Render: Schedule = "Render";
const FixedUpdate = "FixedUpdate";

export const Schedules = {
    Start,
    PreUpdate,
    Update,
    PostUpdate,
    Render,
    FixedUpdate,
};
