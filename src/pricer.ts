import { penceToPounds } from "./money.js";
import { Basket, Catalogue, pence, PricingResult, UnknownProductError } from "./types.js";

// start with simple pricer that just sums up the prices of the products in the basket, without any offers or discounts.

export const priceBasket = (basket: Basket, catalogue: Catalogue): PricingResult => {

    const subTotal = calculateSubTotal(basket, catalogue);

    const discount = pence(0); // no offers or discounts applied yet

    const total = pence(Math.max(0, subTotal - discount));

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