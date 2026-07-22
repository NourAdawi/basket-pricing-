import { describe, expect, it } from "vitest";
import { catalogueFromPounds } from "../../src/catalogue.js";
import { percentageOff } from "../../src/offers/percentage-off.js";

const catalogue = catalogueFromPounds({
    Sardines: 1.89,
    Biscuits: 1.20
});

describe("percentageOff", () => {
    it("takes the percentage off a single unit", () => {
        // 25% of 189p is 47.25p, which rounds down to 47p.
        expect(percentageOff("Sardines", 25).computeDiscount({ Sardines: 1 }, catalogue)).toBe(47);
    });

    it("rounds the line total rather than each unit", () => {
        // 25% of two tins is 94.5p, which rounds up to 95p. Rounding per unit first
        // would give 47p x 2 = 94p. The brief's Basket 2 requires 95p, so this is
        // the difference between matching the brief and being a penny out.
        const discount = percentageOff("Sardines", 25).computeDiscount({ Sardines: 2 }, catalogue);

        expect(discount).toBe(95);
        expect(discount).not.toBe(94);
    });

    it("scales with quantity", () => {
        expect(percentageOff("Sardines", 50).computeDiscount({ Sardines: 4 }, catalogue)).toBe(378);
    });

    it.each([
        [0, 0],
        [100, 189]
    ])("handles %i%% as a boundary, discounting %ip", (percent, expected) => {
        expect(percentageOff("Sardines", percent).computeDiscount({ Sardines: 1 }, catalogue)).toBe(expected);
    });

    it("allows a fractional percentage", () => {
        // 12.5% of 189p is 23.625p -> 24p.
        expect(percentageOff("Sardines", 12.5).computeDiscount({ Sardines: 1 }, catalogue)).toBe(24);
    });

    it("contributes nothing when the product is not in the basket", () => {
        expect(percentageOff("Sardines", 25).computeDiscount({ Biscuits: 3 }, catalogue)).toBe(0);
    });

    it("contributes nothing when the product has left the catalogue", () => {
        // "It's possible that there are offers on products which are no longer in
        // the catalogue." The offer is stale, not broken, so it stays silent.
        expect(percentageOff("Caviar", 25).computeDiscount({ Caviar: 2 }, catalogue)).toBe(0);
    });

    it("does not mistake an inherited object key for a product", () => {
        expect(percentageOff("toString", 25).computeDiscount({ toString: 1 }, catalogue)).toBe(0);
    });

    it.each([
        ["negative", -5],
        ["over one hundred", 101],
        ["not a number", NaN],
        ["infinite", Infinity]
    ])("rejects a %s percentage at construction", (_label, percent) => {
        expect(() => percentageOff("Sardines", percent)).toThrow(RangeError);
    });

    it("describes itself in terms a shopper would recognise", () => {
        expect(percentageOff("Sardines", 25).description).toBe("25% off Sardines");
    });

    it("does not mutate the basket or the catalogue", () => {
        const basket = { Sardines: 2 };
        const basketBefore = { ...basket };
        const catalogueBefore = { ...catalogue };

        percentageOff("Sardines", 25).computeDiscount(basket, catalogue);

        expect(basket).toEqual(basketBefore);
        expect(catalogue).toEqual(catalogueBefore);
    });
});
