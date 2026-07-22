import { roundHalfUp } from "../money.js";
import type { Basket, Catalogue, ProductName } from "../types.js";
import { pence } from "../types.js";
import type { Offer } from "./offer.js";

/**
 * A straight percentage off every unit of one product. "Sardines: 25% discount".
 *
 * `percent` is on the 0 to 100 scale, matching how shop signage talks about it.
 * Fractional percentages are allowed; 12.5% off is a real offer.
 */
export const percentageOff = (product: ProductName, percent: number): Offer => {
    // Misconfiguration fails here at construction,
    // rather than silently mispricing a basket at a till later.
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        throw new RangeError(`Percentage must be between 0 and 100, got ${percent}`);
    }

    return {
        description: `${percent}% off ${product}`,

        computeDiscount(basket: Basket, catalogue: Catalogue) {
            // Neither miss is an error. The catalogue miss is required behaviour:
            // "It's possible that there are offers on products which are no longer
            // in the catalogue" - such an offer simply contributes nothing.
            if (!Object.hasOwn(basket, product) || !Object.hasOwn(catalogue, product)) {
                return pence(0);
            }

            const quantity = basket[product]!;
            const unitPrice = catalogue[product]!;

            // Round the line total, not each unit. 25% off two tins at 189p is
            // roundHalfUp(94.5) = 95p, which is the figure the brief expects.
            // Rounding per unit would give roundHalfUp(47.25) * 2 = 94p and lose
            // the customer a penny.
            return pence(roundHalfUp((unitPrice * quantity * percent) / 100));
        }
    };
};
