import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatMoney, toCents } from "./money";

describe("formatMoney", () => {
  it("formats cents with two decimals", () => {
    assert.equal(formatMoney(0), "0.00");
    assert.equal(formatMoney(5), "0.05");
    assert.equal(formatMoney(1250), "12.50");
  });

  it("groups thousands with commas", () => {
    assert.equal(formatMoney(185000), "1,850.00");
    assert.equal(formatMoney(327255), "3,272.55");
    assert.equal(formatMoney(3927064), "39,270.64");
  });

  it("rounds fractional cents to the nearest cent", () => {
    assert.equal(formatMoney(383448.66666666662786), "3,834.49");
    assert.equal(formatMoney(466666.6666666666), "4,666.67");
    assert.equal(formatMoney(0.4), "0.00");
  });

  it("handles negative values", () => {
    assert.equal(formatMoney(-1250), "-12.50");
    assert.equal(formatMoney(-327255), "-3,272.55");
  });
});

describe("toCents", () => {
  it("converts dollar amounts to integer cents", () => {
    assert.equal(toCents("0"), 0);
    assert.equal(toCents("0.05"), 5);
    assert.equal(toCents("12.50"), 1250);
    assert.equal(toCents("3272.55"), 327255);
  });

  it("rejects invalid amounts", () => {
    assert.ok(Number.isNaN(toCents("abc")));
    assert.ok(Number.isNaN(toCents("")));
    assert.ok(Number.isNaN(toCents("1.2345")));
    assert.ok(Number.isNaN(toCents("1.005")));
    assert.ok(Number.isNaN(toCents("-5")));
  });
});