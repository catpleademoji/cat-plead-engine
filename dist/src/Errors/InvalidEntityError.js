export class InvalidEntityError extends Error {
    constructor(message = "Entity does not exist.") {
        super(message);
        this.name = "InvalidEntity";
    }
}
