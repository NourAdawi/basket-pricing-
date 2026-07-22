import {
    catalogueFromPounds,
    cheapestFreeInSet,
    multiBuy,
    percentageOff,
    priceBasket
} from "./src/index.js";
import type { Basket, Offer } from "./src/index.js";

// Run it via: `npm run demo`.
//
// It prices the three baskets from the assignment and prints them as receipts. Nothing
// here is test infrastructure; it is the library used exactly as a till would use
// it, which is also the fastest way to see whether the interface is pleasant.

// Consumers work in pounds. The price list is kept alongside the catalogue so the
// receipt can show line prices without reaching into the library's internal pence.

const priceList: Record<string, number> = {
    "Baked Beans": 0.99,
    "Biscuits": 1.20,
    "Sardines": 1.89,
    "Shampoo (Small)": 2.00,
    "Shampoo (Medium)": 2.50,
    "Shampoo (Large)": 3.50
};

const catalogue = catalogueFromPounds(priceList);

// Every offer the shop is running today. All of them are handed to every basket:
// an offer that does not apply contributes nothing, so there is no need for the
// caller to work out which rules are relevant to which shopper.


const offers: Offer[] = [
    multiBuy("Baked Beans", 3, 2),
    percentageOff("Sardines", 25),
    cheapestFreeInSet(["Shampoo (Large)", "Shampoo (Medium)", "Shampoo (Small)"], 3)
];

// Formatting belongs to the caller, not the library. priceBasket returns plain
// numbers so they can still be added up or stored.
const money = (pounds: number): string => `£${pounds.toFixed(2)}`;

const printReceipt = (title: string, basket: Basket): void => {
    console.log(title);

    for (const [product, quantity] of Object.entries(basket)) {
        const linePrice = priceList[product]! * quantity;
        console.log(
            `  ${product.padEnd(18)}${String(quantity).padStart(3)}  ${money(linePrice).padStart(8)}`
        );
    }

    const result = priceBasket(basket, catalogue, offers);
    const { subTotal, discount, total } = result;

    console.log(`  ${"-".repeat(31)}`);
    console.log(`  ${"Sub-total".padEnd(21)}${money(subTotal).padStart(10)}`);
    console.log(`  ${"Discount".padEnd(21)}${("-" + money(discount)).padStart(10)}`);
    console.log(`  ${"Total".padEnd(21)}${money(total).padStart(10)}`);
    console.log();
};

console.log("\nOffers running today");
for (const offer of offers) {
    console.log(`  - ${offer.description}`);
}
console.log();

printReceipt("Basket 1", { "Baked Beans": 4, "Biscuits": 1 });
printReceipt("Basket 2", { "Baked Beans": 2, "Biscuits": 1, "Sardines": 2 });
printReceipt("Basket 3", {
    "Shampoo (Large)": 3,
    "Shampoo (Medium)": 1,
    "Shampoo (Small)": 2
});
