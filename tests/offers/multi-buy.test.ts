import { describe, expect, it } from "vitest";
import { catalogueFromPounds } from "../../src/catalogue.js";
import { multiBuy } from "../../src/offers/multi-buy.js";

const catalogue = catalogueFromPounds({
    "Baked Beans": 0.99,
    "Biscuits": 1.20
});

// "Baked Beans: buy 2 get 1 free" from the brief, expressed as three for the price
// of two.
const threeForTwo = multiBuy("Baked Beans", 3, 2);

describe("multiBuy", () => {
    it("gives one item free for one complete group", () => {
        // The brief's Basket 1: four tins is one complete group, so 99p off.
        expect(threeForTwo.computeDiscount({ "Baked Beans": 4 }, catalogue)).toBe(99);
    });

    // Called out by name in the brief: "an three for the price of two offer should
    // also give you six for the price of four and nine for the price of six".
    it.each([
        [3, 99, "three for the price of two"],
        [6, 198, "six for the price of four"],
        [9, 297, "nine for the price of six"]
    ])("%i tins gives %ip off: %s", (quantity, expected) => {
        expect(threeForTwo.computeDiscount({ "Baked Beans": quantity }, catalogue)).toBe(expected);
    });

    it("ignores an incomplete trailing group", () => {
        // Five tins is one whole group plus a remainder of two, so one free tin.
        expect(threeForTwo.computeDiscount({ "Baked Beans": 5 }, catalogue)).toBe(99);
    });

    it.each([0, 1, 2])("discounts nothing for %i tins, below the group size", (quantity) => {
        expect(threeForTwo.computeDiscount({ "Baked Beans": quantity }, catalogue)).toBe(0);
    });

    it("handles buy one get one free", () => {
        const bogof = multiBuy("Baked Beans", 2, 1);

        expect(bogof.computeDiscount({ "Baked Beans": 2 }, catalogue)).toBe(99);
        expect(bogof.computeDiscount({ "Baked Beans": 7 }, catalogue)).toBe(297);
    });

    it("handles more than one free item per group", () => {
        // Four for the price of two: two free per group, so the discount cannot be
        // hard-coded to a single item.
        const fourForTwo = multiBuy("Baked Beans", 4, 2);

        expect(fourForTwo.computeDiscount({ "Baked Beans": 4 }, catalogue)).toBe(198);
        expect(fourForTwo.computeDiscount({ "Baked Beans": 8 }, catalogue)).toBe(396);
    });

    it("contributes nothing when the product is not in the basket", () => {
        expect(threeForTwo.computeDiscount({ "Biscuits": 6 }, catalogue)).toBe(0);
    });

    it("contributes nothing when the product has left the catalogue", () => {
        // "It's possible that there are offers on products which are no longer in
        // the catalogue." The offer is stale, not broken, so it stays silent.
        expect(multiBuy("Caviar", 3, 2).computeDiscount({ "Caviar": 6 }, catalogue)).toBe(0);
    });

    it("does not mistake an inherited object key for a product", () => {
        expect(multiBuy("toString", 3, 2).computeDiscount({ toString: 6 }, catalogue)).toBe(0);
    });

    it.each([
        ["pays for as many as it takes", 3, 3],
        ["pays for more than it takes", 2, 3],
        ["pays for none, a giveaway rather than a multi-buy", 3, 0],
        ["pays a negative amount", 3, -1],
        ["takes a fractional quantity", 3.5, 2],
        ["pays a fractional quantity", 3, 1.5]
    ])("rejects a multi-buy that %s", (_label, buyQty, payQty) => {
        expect(() => multiBuy("Baked Beans", buyQty, payQty)).toThrow(RangeError);
    });

    it("describes itself the way signage does", () => {
        expect(threeForTwo.description).toBe("3 for the price of 2 on Baked Beans");
    });

    it("does not mutate the basket or the catalogue", () => {
        const basket = { "Baked Beans": 4 };
        const basketBefore = { ...basket };
        const catalogueBefore = { ...catalogue };

        threeForTwo.computeDiscount(basket, catalogue);

        expect(basket).toEqual(basketBefore);
        expect(catalogue).toEqual(catalogueBefore);
    });
});
