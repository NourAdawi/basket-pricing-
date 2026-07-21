import { describe, expect, it } from "vitest";
import { catalogueFromPounds } from "../src/catalogue.js";

describe("catalogueFromPounds", () => {
    it("converts pounds to whole pence", () => {
        const catalogue = catalogueFromPounds({ beans: 0.65, milk: 1.30 });

        expect(catalogue.get("beans")).toBe(65);
        expect(catalogue.get("milk")).toBe(130);
    });

    it.each([
        ["not a number", NaN],
        ["negative", -1],
        ["sub-penny precision", 1.239],
        ["infinite", Infinity]
    ])("rejects a %s price at construction", (_label, price) => {
        expect(() => catalogueFromPounds({ milk: price })).toThrow();
    });

    it("names the offending product in the failure", () => {
        expect(() => catalogueFromPounds({ beans: 0.65, milk: NaN })).toThrow(/milk/);
    });
});
