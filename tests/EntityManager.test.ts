import { expect } from "chai";
import { EntityManager } from "../src/Entities/EntityManager";
import { Component } from "../src/Queries/Query";
import { InvalidEntityError } from "../src/Errors/InvalidEntityError";

describe("EntityManager", () => {
    const sut = new EntityManager();
    const Position: Component = "position";
    const Rotation: Component = "rotation";
    const Scale: Component = "scale";

    it("reusing entity should have newer version", () => {
        const entityA = sut.spawnEmpty();
        const entityB = sut.spawnEmpty();
        const entityC = sut.spawnEmpty();
        const entityD = sut.spawnEmpty();

        expect(sut.exists(entityA)).to.be.true;
        expect(sut.exists(entityB)).to.be.true;
        expect(sut.exists(entityC)).to.be.true;
        expect(sut.exists(entityD)).to.be.true;

        const result = sut.destroyEntity(entityB);
        expect(result).to.be.true;

        expect(sut.exists(entityB)).to.be.false;

        const entityBv2 = sut.spawnEmpty();
        expect(sut.exists(entityBv2)).to.be.true;
        expect(entityBv2.version).to.be.greaterThan(entityB.version);

        sut.destroyEntity(entityBv2);

        const entityBv3 = sut.spawnEmpty();
        expect(sut.exists(entityBv3)).to.be.true;
        expect(entityBv3.version).to.be.greaterThan(entityBv2.version);
    });

    describe("spawnEmpty", () => {
        it("should create an entity with no components", () => {
            const entity = sut.spawnEmpty();
            const exists = sut.exists(entity);

            expect(exists).to.be.true;

            const archetype = sut.getArchetype(entity);
            expect(archetype).to.be.an("array").that.is.empty;
        });
    });

    describe("spawnFromComponents", () => {
        it("should create an entity with the given components", () => {
            const componentValues = {
                [Position]: { x: 12, y: 0, z: -1 },
                [Rotation]: { x: 0, y: 0, z: 0 },
                [Scale]: { x: 1, y: 1, z: 1 },
            };

            const entity = sut.spawnFromComponents(componentValues);
            const exists = sut.exists(entity);

            expect(exists).to.be.true;

            const archetype = sut.getArchetype(entity);

            expect(archetype).to.be.an("array").that.deep.equals([
                Position,
                Rotation,
                Scale,
            ]);
        });

        it("should create an empty entity with empty components", () => {
            const componentValues = {};

            const entity = sut.spawnFromComponents(componentValues);
            const exists = sut.exists(entity);

            expect(exists).to.be.true;

            const archetype = sut.getArchetype(entity);

            expect(archetype).to.be.an("array").that.is.empty;
        });
    });

    describe("spawnFromEntity", () => {
        it("should create an entity with the same components as the given entity", () => {
            const componentValues = {
                position: { x: 12, y: 0, z: -1 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
            };

            const entity = sut.spawnFromComponents(componentValues);

            const clone = sut.spawnFromEntity(entity);
            const exists = sut.exists(clone);

            expect(exists).to.be.true;

            const archetype = sut.getArchetype(clone);

            expect(archetype).to.be.an("array").that.deep.equals([
                Position,
                Rotation,
                Scale,
            ]);

            expect(sut.getComponent(clone, Position))
                .to.deep.equals(componentValues.position);
            expect(sut.getComponent(clone, Rotation))
                .to.deep.equals(componentValues.rotation);
            expect(sut.getComponent(clone, Scale))
                .to.deep.equals(componentValues.scale);
        });

        it("should create an empty entity from an empty source entity", () => {
            const componentValues = {};

            const entity = sut.spawnFromComponents(componentValues);

            const clone = sut.spawnFromEntity(entity);
            const exists = sut.exists(clone);

            expect(exists).to.be.true;

            const archetype = sut.getArchetype(entity);

            expect(archetype).to.be.an("array").that.is.empty;
        });

        it("should throw an exception if the entity does not exist", () => {
            const entity = {
                index: 99,
                version: -1,
            };
            expect(sut.exists(entity)).to.be.false;

            expect(() => sut.spawnFromEntity(entity)).throws(InvalidEntityError);
        });
    });

    describe("destroyEntity", () => {
        it("should destroy the entity and it should no longer exist", () => {
            const entity = sut.spawnEmpty();

            expect(sut.exists(entity)).to.be.true;

            const result = sut.destroyEntity(entity);
            expect(result).to.be.true;

            expect(sut.exists(entity)).to.be.false;
        });

        it("should destroy the entity and do nothing on repeated calls", () => {
            const entity = sut.spawnEmpty();

            expect(sut.exists(entity)).to.be.true;

            const result = sut.destroyEntity(entity);
            expect(result).to.be.true;

            expect(sut.exists(entity)).to.be.false;

            const secondResult = sut.destroyEntity(entity);
            expect(secondResult).to.be.false;
        });

        it("should do nothing if entity does not exist", () => {
            const entity = {
                index: 8888,
                version: 123
            };

            const result = sut.destroyEntity(entity);
            expect(result).to.be.false;
        });
    });

    describe("addComponent", () => {
        it("should add the components to the entity", () => {
            const entity = sut.spawnEmpty();

            expect(sut.getArchetype(entity)).to.be.an("array").that.is.empty;

            sut.addComponent(entity, Position);

            expect(sut.getArchetype(entity)).to.deep.equal([Position]);

            sut.addComponent(entity, Rotation);

            expect(sut.getArchetype(entity)).to.deep.equal([Position, Rotation]);

            sut.addComponent(entity, Scale);

            expect(sut.getArchetype(entity)).to.deep.equal([
                Position,
                Rotation,
                Scale,
            ]);
        });

        it("should add the components to the entity with an array of components", () => {
            const entity = sut.spawnEmpty();

            expect(sut.getArchetype(entity)).to.be.an("array").that.is.empty;

            sut.addComponent(entity, [Position, Rotation, Scale]);

            expect(sut.getArchetype(entity)).to.deep.equal([
                Position,
                Rotation,
                Scale,
            ]);
        });

        it("should add the component to the entity and repeated adds do nothing", () => {
            const entity = sut.spawnEmpty();

            expect(sut.getArchetype(entity)).to.be.an("array").that.is.empty;

            sut.addComponent(entity, [Position, Rotation]);

            expect(sut.getArchetype(entity)).to.deep.equal([Position, Rotation]);

            sut.addComponent(entity, Position);

            expect(sut.getArchetype(entity)).to.deep.equal([Position, Rotation]);
        });

        it("should do nothing if the entity already has the components", () => {
            const entity = sut.spawnFromComponents({
                [Position]: { x: 0, y: 0, z: 0 },
                [Rotation]: { x: 0, y: 90, z: 0 }
            });

            sut.addComponent(entity, Position);

            expect(sut.getArchetype(entity)).to.deep.equal([
                Position,
                Rotation
            ]);

            sut.addComponent(entity, Rotation);

            expect(sut.getArchetype(entity)).to.deep.equal([
                Position,
                Rotation
            ]);
        })
    });

    describe("setComponent", () => {
        it("should set the value of the component for the entity", () => {
            const pos = { x: 0, y: 0, z: 0 };

            const entity = sut.spawnFromComponents({
                [Position]: pos
            });

            const newPosition = { x: 10, y: 100, z: 1000 };

            expect(sut.getComponent(entity, Position)).to.not.equal(newPosition);

            sut.setComponent(entity, Position, newPosition);

            expect(sut.getComponent(entity, Position)).to.equal(newPosition);
        });

        it("should add the component with the given value when the entity does not have the component", () => {
            const entity = sut.spawnEmpty();

            const newPosition = { x: 10, y: 100, z: 1000 };

            expect(sut.getComponent(entity, Position)).to.be.undefined;

            sut.setComponent(entity, Position, newPosition);

            expect(sut.getComponent(entity, Position)).to.equal(newPosition);
        });
    });

    describe("hasComponent", () => {
        it("should return true when the entity has the component", () => {
            const entity = sut.spawnFromComponents({
                [Position]: { x: 0, y: 0, z: 0 },
                [Scale]: { x: 1, y: 1, z: 1 },
            });

            expect(sut.hasComponent(entity, Position)).to.be.true;

            expect(sut.hasComponent(entity, Scale)).to.be.true;
        });

        it("should return false when the entity does not have the component", () => {
            const entity = sut.spawnFromComponents({
                [Position]: { x: 0, y: 0, z: 0 },
                [Scale]: { x: 1, y: 1, z: 1 },
            });

            expect(sut.hasComponent(entity, Rotation)).to.be.false;
        });
    });

    describe("removeComponent", () => {
        it("should remove the component from the entity", () => {
            const entity = sut.spawnFromComponents({
                [Position]: { x: 0, y: 0, z: 0 },
                [Scale]: { x: 1, y: 1, z: 1 },
            });

            expect(sut.hasComponent(entity, Position)).to.be.true;
            expect(sut.hasComponent(entity, Scale)).to.be.true;

            sut.removeComponent(entity, Position);
            sut.removeComponent(entity, Scale);

            expect(sut.hasComponent(entity, Position)).to.be.false;
            expect(sut.hasComponent(entity, Scale)).to.be.false;
        });

        it("should remove the component from the entity and do nothing on repeated removes", () => {
            const entity = sut.spawnFromComponents({
                [Position]: { x: 0, y: 0, z: 0 },
                [Scale]: { x: 1, y: 1, z: 1 },
            });

            expect(sut.hasComponent(entity, Position)).to.be.true;

            sut.removeComponent(entity, Position);

            expect(sut.hasComponent(entity, Position)).to.be.false;

            sut.removeComponent(entity, Position);

            expect(sut.hasComponent(entity, Position)).to.be.false;
        });

        it("should do nothing when the entity does not have the component", () => {
            const entity = sut.spawnEmpty();

            sut.removeComponent(entity, Position);
            expect(sut.hasComponent(entity, Position)).to.be.false;
        });
    });
});
