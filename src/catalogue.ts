import { poundsToPence } from "./money.js";
import { Catalogue, ProductName } from "./types.js";

// Consumers of this library work in pounds; pence is an internal representation.
// Converting the whole price list once, here, means a malformed price fails at
// construction rather than part-way through pricing a basket.
export const catalogueFromPounds = (prices: Readonly<Record<ProductName, number>>): Catalogue =>
    Object.fromEntries(Object.entries(prices).map(([productName, pounds]) => {
        try {
            return [productName, poundsToPence(pounds)] as const;
        } catch (cause) {
            throw new RangeError(`Invalid price for "${productName}": ${(cause as Error).message}`, { cause });
        }
    }));
