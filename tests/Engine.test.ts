import { setup } from "mocha";
import { use, expect, assert } from "chai";
import spies from "chai-spies";

let chai = use(spies);

import { Engine } from "../src/Engine";
import { Start, Update } from "../src/Schedule";
import { System } from "../src/System";
import { QueryResult } from "../src/QueryResult";
import { Commands } from "../src/Commands";

describe("Engine", () => {
    describe("should run Start system", () => {
        it("when system has empty query", () => {
            const system = {
                run() { }
            };

            const spy = chai.spy.on(system, "run");

            new Engine()
                .addSystem(Start, system)
                .runStartSystems();

            expect(spy).to.have.been.called();
        });

        it("when system has resource query with matching resources", () => {
            const system: System = {
                query: { resources: ["foo"] },
                run() { }
            };

            const spy = chai.spy.on(system, "run");

            new Engine()
                .addSystem(Start, system)
                .addResource("foo", {})
                .runStartSystems();

            expect(spy).to.have.been.called();
        });
    });

    describe("should not run Start system", () => {
        it("when system has resource query where no matching resource exists", () => {
            const system: System = {
                query: { resources: ["foo"] },
                run() { }
            };

            const spy = chai.spy.on(system, "run");

            new Engine()
                .addSystem(Start, system)
                .runStartSystems();

            expect(spy).to.not.have.been.called();
        });

        it("when system has entity query where no matching entities exist", () => {
            const system: System = {
                query: { all: ["foo"] },
                run() { }
            };

            const spy = chai.spy.on(system, "run");

            new Engine()
                .addSystem(Start, system)
                .runStartSystems();

            expect(spy).to.not.have.been.called();
        });
    });

    describe("should run systems on update", () => {
        it("when system has resource query with matching resources", () => {
            const system: System = {
                query: { resources: ["foo"] },
                run() { }
            };

            const engine = new Engine()
                .addResource("foo", [])
                .addSystem(Update, system);

            const spy = chai.spy.on(system, "run");

            engine.runStartSystems();
            engine.update(1000 / 60);

            expect(spy).to.have.been.called();
        });

        it("when system has entity query with matching entities", () => {
            const initSystem: System = {
                query: { resources: ["commands"] },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;
                    commands.spawnFromComponents({
                        "position": { x: 1, y: 0 }
                    });
                },
            };

            const system: System = {
                query: { all: ["position"] },
                run(queryResult: QueryResult) {
                    queryResult.entities.foreach(entity => {
                        const position = entity["position"];
                        expect(position).to.deep.equal({ x: 1, y: 0 })
                    });
                }
            };

            const engine = new Engine()
                .addSystem(Start, initSystem)
                .addSystem(Update, system);

            const spy = chai.spy.on(system, "run");

            engine.runStartSystems();
            engine.update(1000 / 60);

            expect(spy).to.have.been.called();
        });
    });

    describe("should not run systems on update", () => {
        it("when system has resource query with no matching resources", () => {
            const system: System = {
                query: { resources: ["foo"] },
                run() { }
            };

            const engine = new Engine()
                .addSystem(Update, system);

            const spy = chai.spy.on(system, "run");

            engine.runStartSystems();
            engine.update(1000 / 60);

            expect(spy).to.not.have.been.called();
        });

        it("when system has entity query with no matching entities", () => {
            const systemA: System = {
                query: { all: ["foo"] },
                run() { }
            };

            const systemB: System = {
                query: { any: ["bar"] },
                run() { }
            };

            const engine = new Engine()
                .addSystem(Update, systemA)
                .addSystem(Update, systemB);

            const spyA = chai.spy.on(systemA, "run");
            const spyB = chai.spy.on(systemB, "run");

            engine.runStartSystems();
            engine.update(1000 / 60);

            expect(spyA).to.not.have.been.called();
            expect(spyB).to.not.have.been.called();
        });
    });

    describe("should not run system, until entities are created", () => {
        it("when matching entities are created", () => {
            const systemA: System = {
                query: { resources: ["commands"] },
                run(queryResult: QueryResult) {

                }
            };

            const systemB: System = {
                query: { any: ["position"] },
                run(queryResult: QueryResult) {
                    queryResult.entities.foreach((access) => {
                        const position = access.position as { x: number, y: number };
                        expect(position).to.deep.equal({ x: 10, y: 0 });
                    })
                }
            };

            const systemC: System = {
                query: {
                    resources: ["commands"],
                },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;
                    commands.spawnFromComponents({
                        "position": { x: 10, y: 0 }
                    });
                }
            };

            const engine = new Engine()
                .addSystem(Start, systemA)
                .addSystem(Update, systemB)
                .addSystem(Update, systemC);

            const spyA = chai.spy.on(systemA, "run");
            const spyB = chai.spy.on(systemB, "run");
            const spyC = chai.spy.on(systemC, "run");

            engine.runStartSystems();
            engine.update(1000 / 60);

            expect(spyA).to.have.been.called.exactly(1);
            expect(spyB).to.have.been.called.exactly(0);
            expect(spyC).to.have.been.called.exactly(1);

            engine.update(1000 / 60);

            expect(spyA).to.have.been.called.exactly(1);
            expect(spyB).to.have.been.called.exactly(1);
            expect(spyC).to.have.been.called.exactly(2);
        });
    });

    describe("should run system, then not run", () => {
        it("when matching entities are all destroyed", () => {
            const systemA: System = {
                query: { resources: ["commands"] },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands");
                    commands?.spawnFromComponents({
                        "position": { x: 1, y: 1 }
                    });
                }
            };

            const systemB: System = {
                query: { any: ["position"] },
                run() {

                }
            };

            const systemC: System = {
                query: {
                    any: ["position"],
                    resources: ["commands"],
                },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;
                    queryResult.entities.foreach((_, entity) => {
                        commands.destroyEntity(entity);
                    });
                }
            };

            const engine = new Engine()
                .addSystem(Start, systemA)
                .addSystem(Update, systemB)
                .addSystem(Update, systemC);

            const spyB = chai.spy.on(systemB, "run");
            const spyC = chai.spy.on(systemC, "run");

            engine.runStartSystems();
            engine.update(1000 / 60);

            expect(spyB).to.have.been.called.exactly(1);
            expect(spyC).to.have.been.called.exactly(1);

            engine.update(1000 / 60);

            expect(spyB).to.have.been.called.exactly(1);
            expect(spyC).to.have.been.called.exactly(2);
        });
    });
});