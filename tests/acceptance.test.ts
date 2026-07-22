import { describe, expect, it } from "vitest";
import { catalogueFromPounds } from "../src/catalogue.js";
import { cheapestFreeInSet } from "../src/offers/cheapest-free-in-set.js";
import { multiBuy } from "../src/offers/multi-buy.js";
import { percentageOff } from "../src/offers/percentage-off.js";
import { priceBasket } from "../src/pricer.js";

// The worked examples from the brief, with its own catalogue and its own published
// figures. If this file passes, the library does what was asked; everything else is
// detail. Written before the offers exist so the numbers, not the implementation,
// decide what the offer API has to look like.

const catalogue = catalogueFromPounds({
    "Baked Beans": 0.99,
    "Biscuits": 1.20,
    "Sardines": 1.89,
    "Shampoo (Small)": 2.00,
    "Shampoo (Medium)": 2.50,
    "Shampoo (Large)": 3.50
});

describe("the supermarket's current offers", () => {
    // "Baked Beans: buy 2 get 1 free" is three for the price of two.
    // "Sardines: 25% discount".
    const offers = [
        multiBuy("Baked Beans", 3, 2),
        percentageOff("Sardines", 25)
    ];

    it("Basket 1: Baked Beans x 4, Biscuits x 1", () => {
        const basket = { "Baked Beans": 4, "Biscuits": 1 };

        expect(priceBasket(basket, catalogue, offers)).toEqual({
            subTotal: 5.16,
            discount: 0.99,
            total: 4.17
        });
    });

    it("Basket 2: Baked Beans x 2, Biscuits x 1, Sardines x 2", () => {
        // Two tins of beans is short of the three the offer needs, so the whole
        // discount here is the sardines.
        const basket = { "Baked Beans": 2, "Biscuits": 1, "Sardines": 2 };

        expect(priceBasket(basket, catalogue, offers)).toEqual({
            subTotal: 6.96,
            discount: 0.95,
            total: 6.01
        });
    });
});

describe("buy three, get the cheapest free across a set of products", () => {
    const offers = [
        cheapestFreeInSet(["Shampoo (Large)", "Shampoo (Medium)", "Shampoo (Small)"], 3)
    ];

    it("Basket 3: Shampoo Large x 3, Medium x 1, Small x 2", () => {
        // Six eligible items, so two groups of three and two free items. The brief
        // requires the customer get the largest discount available: one large and
        // one small free, £5.50, not some worse grouping.
        const basket = {
            "Shampoo (Large)": 3,
            "Shampoo (Medium)": 1,
            "Shampoo (Small)": 2
        };

        expect(priceBasket(basket, catalogue, offers)).toEqual({
            subTotal: 17.00,
            discount: 5.50,
            total: 11.50
        });
    });
});
