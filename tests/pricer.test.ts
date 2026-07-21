import { describe, expect, it } from "vitest";
import { catalogueFromPounds } from "../src/catalogue.js";
import { priceBasket } from "../src/pricer.js";
import { Basket, UnknownProductError } from "../src/types.js";

// Prices are written in pounds because that is how a price list reads;
// the factory converts them to the pence the pricer works in.
const catalogue = catalogueFromPounds({
    beans: 0.65,
    bread: 0.80,
    milk: 1.30,
    apples: 1.00,
    dime: 0.10,
    "double-dime": 0.20
});

const basketOf = (items: Record<string, number>): Basket => new Map(Object.entries(items));

describe("priceBasket", () => {
    it("prices an empty basket as zero across the board", () => {
        expect(priceBasket(basketOf({}), catalogue)).toEqual({
            subTotal: 0,
            discount: 0,
            total: 0
        });
    });

    it("prices a single item", () => {
        expect(priceBasket(basketOf({ beans: 1 }), catalogue)).toEqual({
            subTotal: 0.65,
            discount: 0,
            total: 0.65
        });
    });

    it("multiplies by quantity", () => {
        expect(priceBasket(basketOf({ beans: 3 }), catalogue)).toEqual({
            subTotal: 1.95,
            discount: 0,
            total: 1.95
        });
    });

    it("treats a zero quantity as contributing nothing", () => {
        const withZero = priceBasket(basketOf({ bread: 1, milk: 0 }), catalogue);

        expect(withZero).toEqual(priceBasket(basketOf({ bread: 1 }), catalogue));
        expect(withZero.total).toBe(0.80);
    });

    it("throws UnknownProductError for a basket item not in the catalogue", () => {
        expect(() => priceBasket(basketOf({ caviar: 1 }), catalogue)).toThrow(UnknownProductError);
        expect(() => priceBasket(basketOf({ caviar: 1 }), catalogue)).toThrow(/caviar/);
    });

    it("does not fall victim to float drift: 0.10 + 0.20 !== 0.30 in float arithmetic", () => {
        // Guard that the premise still holds, so this test cannot quietly become vacuous.
        expect(0.10 + 0.20).not.toBe(0.30);

        // Summing in pence keeps the result exact where summing in pounds would not.
        expect(priceBasket(basketOf({ dime: 1, "double-dime": 1 }), catalogue).total).toBe(0.30);
    });

    it("stays exact when accumulating many small prices", () => {
        // Ten 10p items: adding 0.10 ten times in floating point gives 0.9999999999999999.
        expect(priceBasket(basketOf({ dime: 10 }), catalogue).total).toBe(1.00);
    });
});
