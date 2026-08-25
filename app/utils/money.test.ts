import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatMoney } from "./money";

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

  it("handles negative values", () => {
    assert.equal(formatMoney(-1250), "-12.50");
    assert.equal(formatMoney(-327255), "-3,272.55");
  });
});