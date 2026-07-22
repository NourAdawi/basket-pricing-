import { describe, expect, it } from "vitest";
import { penceToPounds, poundsToPence, roundHalfUp } from "../src/money.js";

describe("penceToPounds", () => {
    it.each([
        [0, 0],
        [99, 0.99],
        [516, 5.16],
        [1999, 19.99]
    ])("presents %i pence as £%d", (input, expected) => {
        expect(penceToPounds(input)).toBe(expected);
    });

    it.each([
        ["fractional", 94.5],
        ["negative", -1],
        ["not a number", NaN]
    ])("rejects a %s amount", (_label, value) => {
        expect(() => penceToPounds(value)).toThrow(RangeError);
    });
});

describe("poundsToPence", () => {
    it.each([
        [0, 0],
        [0.99, 99],
        [1.20, 120],
        [3.50, 350]
    ])("reads £%d off a price list as %i pence", (input, expected) => {
        expect(poundsToPence(input)).toBe(expected);
    });

    // 19.99 * 100 is 1998.9999999999998 in float. A strict integer check here would
    // reject an ordinary shelf price, which is the whole reason for the tolerance.
    it("accepts prices that float multiplication cannot represent exactly", () => {
        expect(poundsToPence(19.99)).toBe(1999);
        expect(poundsToPence(1.10)).toBe(110);
        expect(poundsToPence(0.29)).toBe(29);
    });

    // The tolerance must not become a silent rounding step: a genuine sub-penny
    // price is a data error upstream and should surface at ingestion.
    it.each([
        ["sub-penny precision", 1.239],
        ["half a penny", 0.005],
        ["negative", -0.01],
        ["not a number", NaN],
        ["infinite", Infinity]
    ])("rejects a %s price", (_label, value) => {
        expect(() => poundsToPence(value)).toThrow(RangeError);
    });
});

describe("roundHalfUp", () => {
    it.each([
        [94.5, 95],
        [47.25, 47],
        [0.5, 1],
        [23.625, 24],
        [1.5, 2],
        [2.5, 3]
    ])("rounds %d to %i", (input, expected) => {
        expect(roundHalfUp(input)).toBe(expected);
    });

    // 2.5 -> 3 above is the case that distinguishes half-up from banker's rounding,
    // which would give 2. Pinning it means a change of policy cannot pass silently.
    it("rounds a half away from zero, not to even", () => {
        expect(roundHalfUp(2.5)).toBe(3);
        expect(roundHalfUp(4.5)).toBe(5);
    });

    it("leaves whole amounts alone", () => {
        expect(roundHalfUp(0)).toBe(0);
        expect(roundHalfUp(189)).toBe(189);
    });

    it.each([
        ["negative", -0.5],
        ["not a number", NaN],
        ["infinite", Infinity]
    ])("rejects a %s amount", (_label, value) => {
        expect(() => roundHalfUp(value)).toThrow(RangeError);
    });
});

describe("round-tripping", () => {
    it.each([0, 1, 99, 120, 189, 250, 350, 1999])(
        "returns %i pence unchanged through pounds and back",
        (amount) => {
            expect(poundsToPence(penceToPounds(amount))).toBe(amount);
        }
    );
});
