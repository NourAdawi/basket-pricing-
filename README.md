# Basket Pricer

A pricing library for a supermarket shopping basket. Given a basket, a catalogue and a set of offers, it works out the sub-total, discount and total.

## How to run

To be filled 

## Design

the intended shape of the solution.

### Interface

The core of the library is a single pure function:

```ts
priceBasket(basket, catalogue, offers): PricingResult
// PricingResult = { subTotal: number; discount: number; total: number }
```


### Offers

Offers implement a small interface:

```ts
interface Offer {
  readonly description: string;
  computeDiscount(basket, catalogue): Pence;
}
```

Each offer receives the whole basket and catalogue and returns the discount it contributes, in pence. Offers that do not apply return 0. This design means new offer types (for example "spend over X, get Y off") can be added by other teams without changing the pricer itself.

Offers are factory functions:

```ts
priceBasket(basket, catalogue, [percentageOff("Sardines", 25)]);
```

Implementations:

- `percentageOff(product, percent)` Percent is on the 0 to 100 scale
- `multiBuy(product, buyQty, payQty)` covers "buy 2 get 1 free" as buy 3 pay 2, and scales to 6 for 4, 9 for 6 automatically.
- `cheapestFreeInSet(products, groupSize)` covers "buy three, cheapest free" across a set of products, maximising the discount for the customer:
   1- Flatten the basket into indiviual prices
   2- Group the products and see how many items go free
   3- Make the free ones as expensive as possible in each group, this is done by ordering products descending, most expensive first


### Money

All internal arithmetic is done in integer pence to avoid floating point drift. Conversion to pounds happens only at the public boundary. Rounding is half-up, applied where an offer produces fractional pence.

Rounding is applied to the **line total, not to each unit**. 25% off two tins of sardines at £1.89 is `roundHalfUp(94.5)` = 95p; rounding each unit first would give 47p × 2 = 94p and cost the customer a penny.

### Assumptions and edge-case - will revisist 

- A basket item missing from the catalogue throws an `UnknownProductError`. 
- An offer referencing a product missing from the catalogue contributes zero discount, silently. The description says catalogue and offers are owned by different teams and can drift apart, so this is expected, not an error.
- Multiple offers on the same product all apply independently. Total can never be negative.
- Invalid offer configuration (for example a negative percentage) throws at construction time. Misconfiguration is a programmer error and should fail early, unlike "offer does not apply", which is a normal runtime situation.
- An empty basket prices to zero.
- A `cheapestFreeInSet` product list is assumed to hold distinct names. A repeated name would count that product's quantity more than once. Not de-duplicated here to keep the offer simple.