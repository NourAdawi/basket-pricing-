# Basket Pricer

A pricing library for a supermarket shopping basket. Given a basket, a catalogue and a set of offers, it works out the sub-total, discount and total.

It is a library, not an application. It does not own basket state, and it does not add or remove items. It answers one question: what does this basket cost today?

## How to run

Requires Node 18 or later. No runtime dependencies.

```bash
npm install
npm test
npm run demo     # prices the assignment's three baskets and prints receipts
```

`npm run demo` is the quickest way to see it working:

```
Offers running today
  - 3 for the price of 2 on Baked Beans
  - 25% off Sardines
  - buy 3, cheapest free across Shampoo (Large), Shampoo (Medium), Shampoo (Small)

Basket 1
  Baked Beans         4     £3.96
  Biscuits            1     £1.20
  -------------------------------
  Sub-total                 £5.16
  Discount                 -£0.99
  Total                     £4.17
```

Every offer is handed to every basket. An offer that does not apply contributes nothing, so a caller never has to work out which rules are relevant to which shopper.

## Usage

```ts
import { catalogueFromPounds, multiBuy, percentageOff, priceBasket } from "basket-pricer";

const catalogue = catalogueFromPounds({
    "Baked Beans": 0.99,
    "Biscuits": 1.20,
    "Sardines": 1.89
});

const offers = [
    multiBuy("Baked Beans", 3, 2),   // buy 2 get 1 free
    percentageOff("Sardines", 25)
];

const basket = { "Baked Beans": 4, "Biscuits": 1 };

priceBasket(basket, catalogue, offers);
// { subTotal: 5.16, discount: 0.99, total: 4.17 }
```

A basket is a plain object of product name to quantity, so a till can build one however it likes. Offers are optional: `priceBasket(basket, catalogue)` returns the undiscounted price.

## Design

### One function

```ts
priceBasket(basket, catalogue, offers?): PricingResult
// PricingResult = { subTotal: number; discount: number; total: number }
```

Pure, with no state of its own. The same three arguments always give the same answer, which makes it easy for a caller to test and impossible for it to disagree with itself between a till and a website.

`total` always equals `subTotal - discount` exactly, even when offers are generous enough to claim more than the basket is worth. In that case the discount is capped at the sub-total, rather than the total being floored at zero, so a receipt never shows figures that do not add up.

### Offers

An offer is anything that can look at a basket and say what it is worth taking off:

```ts
interface Offer {
  readonly description: string;
  computeDiscount(basket, catalogue): Pence;
}
```

An offer that does not apply returns zero rather than throwing, because "no discount" is not a failure.

Each offer sees the **whole** basket rather than a single product. That is the decision the rest of the design rests on: it is what lets a rule span a set of products without needing a second kind of offer.

Offers are factory functions, so there is no `new` in a caller's way:

- `percentageOff(product, percent)` — percent is on the 0 to 100 scale, the way shop signage talks.
- `multiBuy(product, buyQty, payQty)` — "buy 2 get 1 free" is three for the price of two. It counts whole groups, so six for the price of four and nine for the price of six fall out on their own.
- `cheapestFreeInSet(products, groupSize)` — "buy three, cheapest free" across a set of products.

That last one is the only one with a real puzzle in it. The assignment asks for the *largest* discount the customer could get, and how you group the bottles decides which ones go free. The trick is to forget which product each item is, line all the eligible items up most expensive first, and let every third one go free. The number of free items is fixed however you arrange them, so the goal is to make each group's cheapest member as expensive as possible — and putting the expensive items together does exactly that.

### Extending it

New offer types can be written outside this package without touching the pricer. That is the point of the interface being this small:

```ts
import { pence, roundHalfUp } from "basket-pricer";
import type { Offer } from "basket-pricer";

const freeDelivery = (spendThreshold: number, deliveryCost: number): Offer => ({
    description: `Free delivery when you spend over £${spendThreshold}`,
    computeDiscount: (basket, catalogue) => { /* ... */ }
});
```

An implementation has three things to honour: never return a negative amount, return zero rather than throwing when the offer does not apply, and leave the basket and catalogue untouched.

### Money

Everything is counted in whole pence internally and converted to pounds only on the way out, so no discount is ever a third of a penny adrift. `catalogueFromPounds` does that conversion once, when the catalogue is built, which means a malformed price is caught at the door rather than halfway through a customer's shop.

Rounding is half-up, applied to the **line total rather than each item**. 25% off two tins of sardines at £1.89 is 94.5p, so 95p. Rounding each tin first would give 47p twice, and quietly cost the customer a penny.

## Tests

```
tests/
  examples.test.ts    the assignment's three worked baskets, through the public API
  end-to-end.test.ts  offers combining, and the assumptions below, through the public API
  pricer.test.ts      priceBasket, driven by stub offers so the seam is tested on its own
  money.test.ts       conversion, rounding, round-tripping
  catalogue.test.ts   construction-time validation
  offers/             each offer type in isolation
```

The two top files import the library the way a real consumer would, through its public entry point, so anything missing from it fails the build instead of passing quietly.

## Assumptions and decisions

- **A basket item missing from the catalogue throws.** The pricer cannot price what it cannot look up, so it says so rather than guessing.
- **An offer naming a missing product stays silent.** Catalogue and offers are maintained by different teams and drift apart, so a stale offer is expected rather than broken. Deliberately the opposite call to the one above.
- **Several offers on one product all apply.** The alternative, best-offer-wins, is arguably the fairer reading of a real supermarket, and would be the first thing to revisit. Either way the basket can never cost less than nothing.
- **Bad offer configuration fails immediately.** A negative percentage is a mistake by whoever wrote the offer, and should surface when the offer is created rather than at a till at the weekend.
- **An empty basket prices to zero** across the board.
- **A `cheapestFreeInSet` product list is assumed to hold distinct names.** A repeated name would count that product twice. Left undeduplicated to keep the offer simple.
