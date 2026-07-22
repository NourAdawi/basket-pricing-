import type { Basket, Catalogue, ProductName } from "../types.js";
import { pence } from "../types.js";
import type { Offer } from "./offer.js";

/**
 * Take `buyQty`, pay for `payQty`. "Baked Beans: buy 2 get 1 free" is three for
 * the price of two, so `multiBuy("Baked Beans", 3, 2)`.
 *
 * The discount counts whole groups, which is what makes the offer scale on its
 * own: three for the price of two also gives six for the price of four and nine
 * for the price of six, with nothing in here special casing them.
 */
export const multiBuy = (product: ProductName, buyQty: number, payQty: number): Offer => {
    // Misconfiguration fails here at construction, rather than silently
    // mispricing a basket at a till later.
    if (!Number.isInteger(buyQty) || !Number.isInteger(payQty)) {
        throw new RangeError(`Quantities must be whole numbers, got buy ${buyQty} pay ${payQty}`);
    }

    // Paying for at least one, and for fewer than you take. Paying for as many as
    // you take discounts nothing, and paying for none is a giveaway rather than a
    // multi-buy; both are likelier to be a bug in an offer config than a real
    // promotion. This also makes buyQty >= 2 implicit.
    if (payQty < 1 || payQty >= buyQty) {
        throw new RangeError(
            `A multi-buy must pay for at least one and fewer than it takes, got buy ${buyQty} pay ${payQty}`
        );
    }

    const freePerGroup = buyQty - payQty;

    return {
        description: `${buyQty} for the price of ${payQty} on ${product}`,

        computeDiscount(basket: Basket, catalogue: Catalogue) {
            // Neither miss is an error. The catalogue miss is required behaviour:
            // Two guards, and neither miss is an error:
            // basket includes the product, and catalogue still sells it, so there is a price to discount.
            if (!Object.hasOwn(basket, product) || !Object.hasOwn(catalogue, product)) {
                return pence(0);
            }

            const quantity = basket[product]!;
            const unitPrice = catalogue[product]!;

            const freeItems = Math.floor(quantity / buyQty) * freePerGroup;

            return pence(freeItems * unitPrice);
        }
    };
};
