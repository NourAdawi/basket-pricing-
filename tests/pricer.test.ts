import { describe, expect, it } from "vitest";
import { catalogueFromPounds } from "../src/catalogue.js";
import type { Offer } from "../src/offers/offer.js";
import { percentageOff } from "../src/offers/percentage-off.js";
import { priceBasket } from "../src/pricer.js";
import type { Pence } from "../src/types.js";
import { pence, UnknownProductError } from "../src/types.js";

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

describe("priceBasket", () => {
    it("prices an empty basket as zero across the board", () => {
        expect(priceBasket({}, catalogue)).toEqual({
            subTotal: 0,
            discount: 0,
            total: 0
        });
    });

    it("prices a single item", () => {
        expect(priceBasket({ beans: 1 }, catalogue)).toEqual({
            subTotal: 0.65,
            discount: 0,
            total: 0.65
        });
    });

    it("multiplies by quantity", () => {
        expect(priceBasket({ beans: 3 }, catalogue)).toEqual({
            subTotal: 1.95,
            discount: 0,
            total: 1.95
        });
    });

    it("treats a zero quantity as contributing nothing", () => {
        const withZero = priceBasket({ bread: 1, milk: 0 }, catalogue);

        expect(withZero).toEqual(priceBasket({ bread: 1 }, catalogue));
        expect(withZero.total).toBe(0.80);
    });

    it("throws UnknownProductError for a basket item not in the catalogue", () => {
        expect(() => priceBasket({ caviar: 1 }, catalogue)).toThrow(UnknownProductError);
        expect(() => priceBasket({ caviar: 1 }, catalogue)).toThrow(/caviar/);
    });


    it("does not fall victim to float drift: 0.10 + 0.20 !== 0.30 in float arithmetic", () => {
        // Guard that the premise still holds, so this test cannot quietly become vacuous.
        expect(0.10 + 0.20).not.toBe(0.30);

        // Summing in pence keeps the result exact where summing in pounds would not.
        expect(priceBasket({ dime: 1, "double-dime": 1 }, catalogue).total).toBe(0.30);
    });

    it("stays exact when accumulating many small prices", () => {
        // Ten 10p items: adding 0.10 ten times in floating point gives 0.9999999999999999.
        expect(priceBasket({ dime: 10 }, catalogue).total).toBe(1.00);
    });
});

// Stand-in for a real offer. The pricer's only job is to sum whatever the offers
// report and keep the result coherent, so the seam is worth testing before any
// concrete offer exists to plug into it.
const stubOffer = (discountInPence: number): Offer => ({
    description: `stub offer worth ${discountInPence}p`,
    computeDiscount: () => pence(discountInPence)
});

describe("priceBasket with offers", () => {
    it("subtracts an offer's discount from the total", () => {
        expect(priceBasket({ beans: 2 }, catalogue, [stubOffer(30)])).toEqual({
            subTotal: 1.30,
            discount: 0.30,
            total: 1.00
        });
    });

    it("sums the contributions of several offers", () => {
        const result = priceBasket({ beans: 2 }, catalogue, [stubOffer(30), stubOffer(20)]);

        expect(result.discount).toBe(0.50);
        expect(result.total).toBe(0.80);
    });

    it("treats an offer that does not apply as a no-op", () => {
        expect(priceBasket({ beans: 2 }, catalogue, [stubOffer(0)]))
            .toEqual(priceBasket({ beans: 2 }, catalogue));
    });

    it("hands each offer the whole basket and catalogue", () => {
        // Set-based offers need to see every product, not just the one they target.
        const basket = { beans: 2, milk: 1 };
        const seen: { basket: unknown; catalogue: unknown }[] = [];

        priceBasket(basket, catalogue, [{
            description: "recording offer",
            computeDiscount: (b, c) => {
                seen.push({ basket: b, catalogue: c });
                return pence(0);
            }
        }]);

        expect(seen).toHaveLength(1);
        expect(seen[0]!.basket).toEqual(basket);
        expect(seen[0]!.catalogue).toEqual(catalogue);
    });

    it("caps an over-generous discount at the sub-total", () => {
        // 130p of beans against an offer claiming 500p. Baskets cannot cost less
        // than nothing, so the discount is capped rather than the total floored.
        const result = priceBasket({ beans: 2 }, catalogue, [stubOffer(500)]);

        expect(result.subTotal).toBe(1.30);
        expect(result.discount).toBe(1.30);
        expect(result.total).toBe(0);
    });

    it("keeps total === subTotal - discount even when the discount is capped", () => {
        // Flooring the total instead would report a 5.00 discount beside a 0 total,
        // which is internally inconsistent for anything printing a receipt.
        const result = priceBasket({ beans: 2 }, catalogue, [stubOffer(500)]);

        expect(result.total).toBe(result.subTotal - result.discount);
    });

    it("fails loudly on an offer that breaks the contract", () => {
        // The Pence return type says a discount can be neither negative nor
        // fractional. A third-party implementation written in JavaScript, or one
        // casting its way past the type, can still do it. The cast here is what
        // such an offer looks like from the pricer's side.
        const rogueOffer = (value: number): Offer => ({
            description: "ignores the contract",
            computeDiscount: () => value as Pence
        });

        expect(() => priceBasket({ beans: 2 }, catalogue, [rogueOffer(-10)])).toThrow(RangeError);
        expect(() => priceBasket({ beans: 2 }, catalogue, [rogueOffer(12.5)])).toThrow(RangeError);
    });

    it("prices normally when an offer names a product that is no longer stocked", () => {

        const stale = percentageOff("Caviar", 25);

        expect(priceBasket({ beans: 2 }, catalogue, [stale]))
            .toEqual(priceBasket({ beans: 2 }, catalogue));
    });

    it("does not mutate the offers it is given", () => {
        const offers = [stubOffer(30)];

        priceBasket({ beans: 2 }, catalogue, offers);

        expect(offers).toHaveLength(1);
    });
});
