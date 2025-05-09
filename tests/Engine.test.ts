import { use, expect } from "chai";
import spies from "chai-spies";

let chai = use(spies);

import { Engine } from "../src/Engine";
import { Schedules } from "../src/Systems/Schedule";
import { System } from "../src/Systems/System";
import { QueryResult } from "../src/Queries/QueryResult";
import { Commands } from "../src/Commands";
import { Runner } from "../src/Runner";

const dummyRunner: Runner = {
    start(callback) { callback(0) },
    stop() { }
};

describe("Engine", () => {

    describe("should run Schedules.Start system", () => {
        it("when system has empty query", () => {
            const system = {
                run() { }
            };

            const spy = chai.spy.on(system, "run");

            new Engine(dummyRunner)
                .addSystem(Schedules.Start, system)
                .run();

            expect(spy).to.have.been.called();
        });

        it("when system has resource query with matching resources", () => {
            const system: System = {
                query: { resources: ["foo"] },
                run() { }
            };

            const spy = chai.spy.on(system, "run");

            new Engine(dummyRunner)
                .addSystem(Schedules.Start, system)
                .addResource("foo", {})
                .run();

            expect(spy).to.have.been.called();
        });
    });

    describe("should not run Schedules.Start system", () => {
        it("when system has resource query where no matching resource exists", () => {
            const system: System = {
                query: { resources: ["foo"] },
                run() { }
            };

            const spy = chai.spy.on(system, "run");

            new Engine(dummyRunner)
                .addSystem(Schedules.Start, system)
                .run();

            expect(spy).to.not.have.been.called();
        });

        it("when system has entity query where no matching entities exist", () => {
            const system: System = {
                query: { all: ["foo"] },
                run() { }
            };

            const spy = chai.spy.on(system, "run");

            new Engine(dummyRunner)
                .addSystem(Schedules.Start, system)
                .run();

            expect(spy).to.not.have.been.called();
        });
    });

    describe("should run systems on update", () => {
        it("when system has resource query with matching resources", () => {
            const system: System = {
                query: { resources: ["foo"] },
                run() { }
            };

            const engine = new Engine(dummyRunner)
                .addResource("foo", [])
                .addSystem(Schedules.Update, system);

            const spy = chai.spy.on(system, "run");

            engine.run();
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

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Start, initSystem)
                .addSystem(Schedules.Update, system);

            const spy = chai.spy.on(system, "run");

            engine.run();
            engine.update(1000 / 60);

            expect(spy).to.have.been.called();
        });

        it("when system has entity query with matching entities with optional components", () => {
            const initSystem: System = {
                query: { resources: ["commands"] },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;
                    commands.spawnFromComponents({
                        "position": { x: 1, y: 0 }
                    });
                    commands.spawnEmpty();
                },
            };

            const system: System = {
                query: { any: ["position"] },
                run(queryResult: QueryResult) {
                    expect(queryResult.entities.count()).to.equal(2);
                }
            };

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Start, initSystem)
                .addSystem(Schedules.Update, system);

            const spy = chai.spy.on(system, "run");

            engine.run();
            engine.update(1000 / 60);

            expect(spy).to.have.been.called();
        });

        it("when system has entity query with matching entities with excluding components", () => {
            const initSystem: System = {
                query: { resources: ["commands"] },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;
                    commands.spawnFromComponents({
                        "position": { x: 1, y: 0 }
                    });
                    commands.spawnEmpty();
                },
            };

            const system: System = {
                query: { none: ["position"] },
                run(queryResult: QueryResult) {
                    expect(queryResult.entities.count()).to.equal(1);
                }
            };

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Start, initSystem)
                .addSystem(Schedules.Update, system);

            const spy = chai.spy.on(system, "run");

            engine.run();
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

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Update, system);

            const spy = chai.spy.on(system, "run");

            engine.run();
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

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Update, systemA)
                .addSystem(Schedules.Update, systemB);

            const spyA = chai.spy.on(systemA, "run");
            const spyB = chai.spy.on(systemB, "run");

            engine.run();
            engine.update(1000 / 60);

            expect(spyA).to.not.have.been.called();
            expect(spyB).to.not.have.been.called();
        });

        it("when system has entity query with only partially matching entities", () => {
            type Vector2 = {
                x: number;
                y: number;
            };
            const systemA: System = {
                query: { resources: ["commands"] },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;
                    commands.spawnFromComponents({
                        "position": { x: 0, y: 0 },
                        "velocity": { x: 0, y: 0 },
                    });
                }
            };

            const systemB: System = {
                query: { all: ["position", "velocity", "inv_mass"] },
                run(queryResult: QueryResult) {

                    queryResult.entities.foreach(access => {
                        const _velocity = access["velocity"] as Vector2;
                        const _position = access["position"] as Vector2;
                        access["position"] = {
                            x: _position.x + _velocity.x,
                            y: _position.y + _velocity.y,
                        };
                    });
                }
            };

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Start, systemA)
                .addSystem(Schedules.Update, systemB);

            const spyA = chai.spy.on(systemA, "run");
            const spyB = chai.spy.on(systemB, "run");

            engine.run();
            engine.update(1000 / 60);

            expect(spyA).to.have.been.called();
            expect(spyB).to.not.have.been.called();
        });
    });

    describe("should not run systems", () => {
        it("until entities are created", () => {
            const systemA: System = {
                query: { resources: ["commands"] },
                run(queryResult: QueryResult) {

                }
            };

            const systemB: System = {
                query: { all: ["position"] },
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

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Start, systemA)
                .addSystem(Schedules.Update, systemB)
                .addSystem(Schedules.Update, systemC);

            const spyA = chai.spy.on(systemA, "run");
            const spyB = chai.spy.on(systemB, "run");
            const spyC = chai.spy.on(systemC, "run");

            engine.run();

            expect(spyA).to.have.been.called.once;
            expect(spyB).to.have.not.been.called;
            expect(spyC).to.have.been.called.once;

            engine.update(1000 / 60);

            expect(spyA).to.have.been.called.once;
            expect(spyB).to.have.been.called.once;
            expect(spyC).to.have.been.called.twice;
        });

        it("after entities are destroyed", () => {
            const systemA: System = {
                query: {
                    resources: ["commands"],
                },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;
                    for (let i = 0; i < 100; i++) {
                        commands.spawnFromComponents({
                            "position": { x: 10, y: i }
                        });
                    }
                }
            };

            const systemB: System = {
                query: { all: ["position"] },
                run(queryResult: QueryResult) {
                    queryResult.entities.foreach((access) => {
                        const position = access.position as { x: number, y: number };
                    })
                }
            };

            const systemC: System = {
                query: {
                    resources: ["commands"],
                    all: ["position"]
                },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;
                    queryResult.entities.foreach((_, entity) => {
                        commands.destroyEntity(entity);
                    });
                }
            };

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Start, systemA)
                .addSystem(Schedules.Update, systemB)
                .addSystem(Schedules.Update, systemC);

            const spyA = chai.spy.on(systemA, "run");
            const spyB = chai.spy.on(systemB, "run");
            const spyC = chai.spy.on(systemC, "run");

            engine.run();

            expect(spyA).to.have.been.called.once;
            expect(spyB).to.have.been.called.once;
            expect(spyC).to.have.been.called.once;

            engine.update(1000 / 60);

            expect(spyA).to.have.been.called.once;
            expect(spyB).to.have.been.called.once;
            expect(spyC).to.have.been.called.twice;
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

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Start, systemA)
                .addSystem(Schedules.Update, systemB)
                .addSystem(Schedules.Update, systemC);

            const spyB = chai.spy.on(systemB, "run");
            const spyC = chai.spy.on(systemC, "run");

            engine.run();

            expect(spyB).to.have.been.called.once;
            expect(spyC).to.have.been.called.once;

            engine.update(1000 / 60);

            expect(spyB).to.have.been.called.once;
            expect(spyC).to.have.been.called.twice;
        });
    });

    describe("run", () => {
        it("should run start systems", () => {
            const startSystem: System = {
                query: { resources: ["foo"] },
                run() { }
            };
            const updateSystem: System = {
                query: { resources: ["foo"] },
                run() { }
            };

            const startSystemSpy = chai.spy.on(startSystem, "run");
            const updateSystemSpy = chai.spy.on(updateSystem, "run");

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Start, startSystem)
                .addSystem(Schedules.Update, updateSystem)
                .addResource("foo", {});

            engine.run();

            expect(startSystemSpy).to.have.been.called.once;
            expect(updateSystemSpy).to.have.been.called.once;

            engine.update(0);

            expect(startSystemSpy).to.have.been.called.once;
            expect(updateSystemSpy).to.have.been.called.twice;
        });
    });

    describe("should be able to get components in system", () => {
        it("when reusing entities", () => {
            const createEntitiesOnStartSystem: System = {
                query: { resources: ["commands"] },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;
                    for (let i = 0; i < 5; i++) {
                        commands.spawnFromComponents({
                            "value": i
                        });
                    }
                }
            };
            const updateSystem: System = {
                query: {
                    all: ["value"],
                },
                run(queryResult: QueryResult) {
                    queryResult.entities.foreach((_components, entity) => {
                        const value = queryResult.entities.getComponent(entity, "value");
                        expect(value).to.not.be.NaN;
                    });
                }
            };
            const destroyEntitiesSystem: System = {
                query: {
                    resources: ["commands"],
                    all: ["value"],
                },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;

                    queryResult.entities.foreach((components, entity) => {
                        const value = components["value"] as number;
                        if (value % 2 === 0) {
                            commands.destroyEntity(entity);
                        }
                    });
                }
            };
            const createEntitiesSystem: System = {
                query: { resources: ["commands"] },
                run(queryResult: QueryResult) {
                    const commands = queryResult.resources.get<Commands>("commands")!;
                    for (let i = 0; i < 2; i++) {
                        commands.spawnFromComponents({
                            "value": i * 10
                        });
                    }
                }
            };

            const engine = new Engine(dummyRunner)
                .addSystem(Schedules.Start, createEntitiesOnStartSystem)
                .addSystem(Schedules.Update, updateSystem)
                .addSystem(Schedules.Update, destroyEntitiesSystem)
                .addSystem(Schedules.Update, createEntitiesSystem);

            engine.run();
            engine.update(0);
        });
    });
});