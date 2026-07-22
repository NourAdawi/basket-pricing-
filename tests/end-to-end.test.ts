import { describe, expect, it } from "vitest";

import {
    catalogueFromPounds,
    cheapestFreeInSet,
    multiBuy,
    percentageOff,
    priceBasket
} from "../src/index.js";

// The library driven through its public entry point, as a till or a web shop would
// use it. Where examples.test.ts pins the test description examples, this file
// covers behaviour the description leaves to the implementation 
// These tests show what actually happens when a customer's basket meets a day's promotions.

const catalogue = catalogueFromPounds({
    "Baked Beans": 0.99,
    "Biscuits": 1.20,
    "Sardines": 1.89,
    "Shampoo (Small)": 2.00,
    "Shampoo (Large)": 3.50
});

describe("A full shop with every kind of offer running", () => {
    it("prices a basket touched by all three offer types", () => {
        // Sub-total 1992p: 6 beans 594, 2 sardines 378, 2 large shampoo 700,
        // 1 small shampoo 200, 1 packet of biscuits 120.
        //
        // Discounts, each from a different offer:
        //   beans    two complete three-for-twos, two tins free   198p
        //   sardines 25% of 378p, rounded from 94.5p               95p
        //   shampoo  three bottles, the 200p one free             200p
        // Biscuits carry no offer and are simply paid for.
        const offers = [
            multiBuy("Baked Beans", 3, 2),
            percentageOff("Sardines", 25),
            cheapestFreeInSet(["Shampoo (Large)", "Shampoo (Small)"], 3)
        ];

        const basket = {
            "Baked Beans": 6,
            "Sardines": 2,
            "Shampoo (Large)": 2,
            "Shampoo (Small)": 1,
            "Biscuits": 1
        };

        expect(priceBasket(basket, catalogue, offers)).toEqual({
            subTotal: 19.92,
            discount: 4.93,
            total: 14.99
        });
    });
});

describe("Several offers on one product", () => {
    it("applies every offer independently rather than picking the best", () => {
        // Six tins at 99p is 594p. Three for two frees two tins, 198p. A 10% off
        // takes 59p from the same six tins, rounded from 59.4p. Both apply, so the
        // discount is 257p, not the 198p a best-offer-wins policy would give.
        //
        // This pins a documented decision rather than an obviously correct one. If
        // the policy ever changes to best-offer-wins, this test should fail and be
        // updated deliberately.
        const offers = [
            multiBuy("Baked Beans", 3, 2),
            percentageOff("Baked Beans", 10)
        ];

        expect(priceBasket({ "Baked Beans": 6 }, catalogue, offers)).toEqual({
            subTotal: 5.94,
            discount: 2.57,
            total: 3.37
        });
    });

    it("does not depend on the order the offers are given in", () => {
        const basket = { "Baked Beans": 6 };
        const multi = multiBuy("Baked Beans", 3, 2);
        const percent = percentageOff("Baked Beans", 10);

        expect(priceBasket(basket, catalogue, [multi, percent]))
            .toEqual(priceBasket(basket, catalogue, [percent, multi]));
    });

    it("never lets a basket cost less than nothing", () => {
        // Everything free, plus a multi-buy on top of it. Between them the offers
        // claim more than the basket is worth, so the discount is capped at the
        // sub-total rather than the total being floored, which keeps
        // total === subTotal - discount true on the receipt.
        const offers = [
            percentageOff("Baked Beans", 100),
            multiBuy("Baked Beans", 3, 2)
        ];

        const result = priceBasket({ "Baked Beans": 6 }, catalogue, offers);

        expect(result).toEqual({ subTotal: 5.94, discount: 5.94, total: 0 });
        expect(result.total).toBe(result.subTotal - result.discount);
    });
});

describe("Offers and catalogue maintained by different teams", () => {
    it("prices a basket normally when an offer names a product no longer sold", () => {
        // "It's possible that there are offers on products which are no longer in
        // the catalogue." Such an offer is stale, not broken: it contributes
        // nothing and the rest of the shop prices as usual.
        const offers = [
            multiBuy("Baked Beans", 3, 2),
            percentageOff("Caviar", 25)
        ];

        expect(priceBasket({ "Baked Beans": 3 }, catalogue, offers))
            .toEqual(priceBasket({ "Baked Beans": 3 }, catalogue, [offers[0]!]));
    });

    it("prices a basket normally when a product carries no offer at all", () => {
        // "It's also possible that there are items in the catalogue with no offers."
        expect(priceBasket({ "Biscuits": 2 }, catalogue, [multiBuy("Baked Beans", 3, 2)]))
            .toEqual({ subTotal: 2.40, discount: 0, total: 2.40 });
    });
});
