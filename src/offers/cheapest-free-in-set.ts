import type { Basket, Catalogue, ProductName } from "../types.js";
import { pence } from "../types.js";
import type { Offer } from "./offer.js";

/**
 * Buy `groupSize` items from a set of products, get the cheapest of them free.
 *
 * Items are pooled across the whole set, so three Large and two Small bottles are
 * grouped together as five items rather than as two separate products.
 */
export const cheapestFreeInSet = (
    products: readonly ProductName[],
    groupSize: number
): Offer => {
    // Misconfiguration fails here at construction, rather than silently
    // mispricing a basket at a till later.
    if (products.length === 0) {
        throw new RangeError("A set offer needs at least one product");
    }

    if (!Number.isInteger(groupSize) || groupSize < 2) {
        throw new RangeError(`Group size must be a whole number of at least 2, got ${groupSize}`);
    }

    return {
        description: `buy ${groupSize}, cheapest free across ${products.join(", ")}`,

        computeDiscount(basket: Basket, catalogue: Catalogue) {

            // Flatten the eligible products into one price per item
            const prices = products
                .filter(name => Object.hasOwn(basket, name) && Object.hasOwn(catalogue, name))
                .flatMap(name => Array.from({ length: basket[name]! }, () => catalogue[name]!))
                .sort((a, b) => b - a);

            // The number of free items is fixed at floor(prices.length / groupSize)
            // however the items are arranged, so the job is to make each group's
            // cheapest member as expensive as possible. An item can only be free if
            // groupSize - 1 items at least as expensive share its group, so the best
            // available first free item is the groupSize-th most expensive overall.
            // Sorting descending and taking every groupSize-th price does exactly
            // that, and leaves the cheapest items in the incomplete trailing group
            // where they cost the customer least.

            let discount = 0;
            for (let i = groupSize - 1; i < prices.length; i += groupSize) {
                discount += prices[i]!;
            }

            return pence(discount);
        }
    };
};
