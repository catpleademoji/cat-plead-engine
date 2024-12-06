
export class InvalidEntityError extends Error {
    constructor(message: string = "Entity does not exist.") {
        super(message);
        this.name = "InvalidEntity";
    }
}
