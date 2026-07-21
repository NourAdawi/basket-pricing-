type Pence = number & { readonly __brand: "Pence" };

export const pence = (value: number): Pence => {
    if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(`Pence must be a positive integer, got ${value}`);
    }
    return value as Pence;
};

export type ProductName = string;

export type Basket = ReadonlyMap<ProductName, number>;

export type Catalogue = ReadonlyMap<ProductName, Pence>;

export interface PricingResult {
    readonly subTotal: number; // in pounds
    readonly discount: number;
    readonly total: number;
}

export class UnknownProductError extends Error {
    constructor(readonly productName: ProductName) {
        super(`Product not in catalogue: "${productName}"`);
        this.name = "UnknownProductError";
    }
}