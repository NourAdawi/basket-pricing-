import type { Basket, Catalogue, Pence } from "../types.js";

/**
 * A pricing rule. Implemented by this library, and by anyone extending it.
 *
 * The contract:
 * - `computeDiscount` returns the discount this offer contributes, in pence.
 *   Never negative; a discount is a positive amount that gets subtracted.
 * - An offer that does not apply returns zero. That is a normal outcome, not an
 *   error: catalogue and offers are maintained by different teams and may drift,
 *   so an offer on a product that is no longer stocked is expected.
 * - Implementations must not mutate the basket or the catalogue.
 * - An offer receives the whole basket rather than a single product, so rules
 *   spanning a set of products need no second interface.
 */
export interface Offer {
    readonly description: string;
    computeDiscount(basket: Basket, catalogue: Catalogue): Pence;
}