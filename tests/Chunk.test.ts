import { expect } from "chai";
import { Chunk } from "../src/Chunk";

describe("Chunk", () => {
    describe("add", () => {
        it("should add an entity to the chunk", () => {
            const components = new Set([
                "a",
                "b",
            ]);
            const chunk = new Chunk({ id: 1, components });

            const entityA = {
                a: 6,
                b: 9
            };
            const entityB = {
                a: 42,
                b: 0
            };

            chunk.add({ index: 0, version: 0 }, entityA);
            chunk.add({ index: 1, version: 5 }, entityB);

            expect(chunk.count).to.equal(2);

            expect(chunk.getEntity(0)).to.deep.equal({ index: 0, version: 0 });
            expect(chunk.getComponent(0, "a")).to.equal(entityA.a);
            expect(chunk.getComponent(0, "b")).to.equal(entityA.b);

            expect(chunk.getEntity(1)).to.deep.equal({ index: 1, version: 5 });
            expect(chunk.getComponent(1, "a")).to.equal(entityB.a);
            expect(chunk.getComponent(1, "b")).to.equal(entityB.b);
        });
    });

    describe("delete", () => {
        it("should remove the entity from the chunk", () => {
            const components = new Set([
                "a",
                "b",
            ]);
            const chunk = new Chunk({ id: 1, components });

            const entityA = {
                a: 6,
                b: 9
            };
            const entityB = {
                a: 42,
                b: 0
            };

            chunk.add({ index: 0, version: 0 }, entityA);
            chunk.add({ index: 1, version: 5 }, entityB);

            chunk.remove(1);

            expect(chunk.count).to.equal(1);

            expect(chunk.getEntity(0)).to.deep.equal({ index: 0, version: 0 });
            expect(chunk.getComponent(0, "a")).to.equal(entityA.a);
            expect(chunk.getComponent(0, "b")).to.equal(entityA.b);

            chunk.remove(0);

            expect(chunk.count).to.equal(0);
        });
    })
});
