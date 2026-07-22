import { penceToPounds } from "./money.js";
import type { Offer } from "./offers/offer.js";
import type { Basket, Catalogue, Pence, PricingResult } from "./types.js";
import { pence, UnknownProductError } from "./types.js";


export const priceBasket = (
    basket: Basket,
    catalogue: Catalogue,
    offers: readonly Offer[] = []
): PricingResult => {

    const subTotal = calculateSubTotal(basket, catalogue);

    const discount = calculateDiscount(basket, catalogue, offers, subTotal);

    const total = pence(subTotal - discount);

    return {
        subTotal: penceToPounds(subTotal),
        discount: penceToPounds(discount),
        total: penceToPounds(total)
    }
}

const calculateSubTotal = (basket: Basket, catalogue: Catalogue): number => {
    return Object.entries(basket).reduce((total, [productName, quantity]) => {

        if (!Object.hasOwn(catalogue, productName)) {
            throw new UnknownProductError(productName);
        }

        const unitPrice = catalogue[productName]!;

        return total + unitPrice * quantity;
    }, 0);
}

const calculateDiscount = (
    basket: Basket,
    catalogue: Catalogue,
    offers: readonly Offer[],
    subTotal: number
): Pence => {
    const claimed = offers.reduce(
        (running, offer) => running + offer.computeDiscount(basket, catalogue),
        0
    );

    // Clamp the discount, a basket can never cost less than 0
    return pence(Math.min(claimed, subTotal));
}
