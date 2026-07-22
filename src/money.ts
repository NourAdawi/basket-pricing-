import { pence } from "./types.js";

// Prices are held as whole pence internally; pounds are only for presenting results.
export const penceToPounds = (value: number): number => {
    if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(`Pence must be a positive integer, got ${value}`);
    }
    return value / 100;
};

// Math.round already does Half-up rounding for non-negatives; named so the policy is explicit and swappable
export const roundHalfUp = (value: number): number => {
    if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(`Cannot round a negative or non-finite amount, got ${value}`);
    }
    return Math.round(value);
};

// Inverse of penceToPounds, for reading pounds off a price list into the catalogue.
export const poundsToPence = (value: number) => {
    if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(`Pounds must be a positive number, got ${value}`);
    }
    const rounded = Math.round(value * 100);
    // 19.99 * 100 is 1998.9999999999998, so compare loosely: this rejects real
    // sub-penny precision (1.239) rather than silently rounding it away.
    if (Math.abs(value * 100 - rounded) > 1e-6) {
        throw new RangeError(`Pounds cannot be more precise than a penny, got ${value}`);
    }
    return pence(rounded);
};
