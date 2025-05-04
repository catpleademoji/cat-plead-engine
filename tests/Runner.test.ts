import { use, expect } from "chai";
import { JSDOM } from "jsdom";
import spies from "chai-spies";
let chai = use(spies);

import { DefaultRunner } from "../src/Runner";

describe("DefaultRunner", () => {
    let window;
    before(() => {
        window = global.window;
        // @ts-ignore
        global.window = (new JSDOM(``, { pretendToBeVisual: true })).window;
    });

    after(() => {
        global.window = window;
    });

    it("should run callback", async () => {
        return new Promise((resolve) => {
            const runner = new DefaultRunner();
            const spy = chai.spy(() => {
                runner.stop();
                expect(spy).to.have.been.called.at.least(1);
                resolve();
            });
            runner.start(spy);
        });
    });
});
