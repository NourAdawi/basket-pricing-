import { describe, expect, it } from "vitest";
import { catalogueFromPounds } from "../../src/catalogue.js";
import { cheapestFreeInSet } from "../../src/offers/cheapest-free-in-set.js";

const catalogue = catalogueFromPounds({
    "Shampoo (Small)": 2.00,
    "Shampoo (Medium)": 2.50,
    "Shampoo (Large)": 3.50,
    "Biscuits": 1.20
});

const shampooSet = ["Shampoo (Large)", "Shampoo (Medium)", "Shampoo (Small)"];
const buyThreeCheapestFree = cheapestFreeInSet(shampooSet, 3);

describe("cheapestFreeInSet", () => {
    it("prices the shampoo example", () => {

        const basket = {
            "Shampoo (Large)": 3,
            "Shampoo (Medium)": 1,
            "Shampoo (Small)": 2
        };

        expect(buyThreeCheapestFree.computeDiscount(basket, catalogue)).toBe(550);
    });

    it("groups to maximise the discount, not merely to group", () => {

        const priced = catalogueFromPounds({ a: 1.00, b: 2.00, c: 3.00, d: 4.00, e: 5.00 });
        const offer = cheapestFreeInSet(["a", "b", "c", "d", "e"], 3);

        expect(offer.computeDiscount({ a: 1, b: 1, c: 1, d: 1, e: 1 }, priced)).toBe(300);
    });

    it("frees the cheapest of exactly one group", () => {
        const basket = { "Shampoo (Large)": 1, "Shampoo (Medium)": 1, "Shampoo (Small)": 1 };

        expect(buyThreeCheapestFree.computeDiscount(basket, catalogue)).toBe(200);
    });

    it("ignores an incomplete trailing group", () => {

        const basket = { "Shampoo (Large)": 3, "Shampoo (Small)": 2 };

        expect(buyThreeCheapestFree.computeDiscount(basket, catalogue)).toBe(350);
    });

    it.each([0, 1, 2])("discounts nothing for %i items, below the group size", (quantity) => {
        expect(buyThreeCheapestFree.computeDiscount({ "Shampoo (Large)": quantity }, catalogue)).toBe(0);
    });

    it("pools items across different products in the set", () => {
        // One bottle of each of three products is still a complete group. Without
        // pooling, no single product reaches three and the discount would be zero.
        const basket = { "Shampoo (Large)": 1, "Shampoo (Medium)": 1, "Shampoo (Small)": 1 };

        expect(buyThreeCheapestFree.computeDiscount(basket, catalogue)).toBe(200);
    });

    it("behaves like a plain multi-buy when the set holds one product", () => {
        const basket = { "Shampoo (Large)": 7 };

        // Seven bottles, two complete groups, two free at 350 each.
        expect(cheapestFreeInSet(["Shampoo (Large)"], 3).computeDiscount(basket, catalogue)).toBe(700);
    });



    it("ignores products outside the set", () => {
        // Biscuits are in the basket and the catalogue but not in the offer's set,
        // so they neither count towards a group nor get discounted.
        const basket = { "Shampoo (Large)": 2, "Biscuits": 10 };

        expect(buyThreeCheapestFree.computeDiscount(basket, catalogue)).toBe(0);
    });

    it("skips a product that has left the catalogue without losing the rest", () => {
        // "It's possible that there are offers on products which are no longer in
        // the catalogue." The stale name is dropped; the remaining products still
        // form groups normally.
        const offer = cheapestFreeInSet([...shampooSet, "Shampoo (Discontinued)"], 3);
        const basket = { "Shampoo (Large)": 3, "Shampoo (Discontinued)": 5 };

        expect(offer.computeDiscount(basket, catalogue)).toBe(350);
    });

    it("contributes nothing for an empty basket", () => {
        expect(buyThreeCheapestFree.computeDiscount({}, catalogue)).toBe(0);
    });

    it("does not mistake an inherited object key for a product", () => {
        expect(cheapestFreeInSet(["toString"], 3).computeDiscount({ toString: 6 }, catalogue)).toBe(0);
    });

    it.each([
        ["one, which would make every item free", 1],
        ["zero", 0],
        ["negative", -3],
        ["fractional", 2.5]
    ])("rejects a group size of %s at construction", (_label, groupSize) => {
        expect(() => cheapestFreeInSet(shampooSet, groupSize)).toThrow(RangeError);
    });

    it("rejects a set with no products at construction", () => {
        expect(() => cheapestFreeInSet([], 3)).toThrow(RangeError);
    });

    it("describes itself the way signage does", () => {
        expect(buyThreeCheapestFree.description).toBe(
            "buy 3, cheapest free across Shampoo (Large), Shampoo (Medium), Shampoo (Small)"
        );
    });

    it("does not mutate the basket, the catalogue or the product set", () => {
        const basket = { "Shampoo (Large)": 3, "Shampoo (Small)": 2 };
        const basketBefore = { ...basket };
        const catalogueBefore = { ...catalogue };
        const setBefore = [...shampooSet];

        buyThreeCheapestFree.computeDiscount(basket, catalogue);

        expect(basket).toEqual(basketBefore);
        expect(catalogue).toEqual(catalogueBefore);
        expect(shampooSet).toEqual(setBefore);
    });
});
