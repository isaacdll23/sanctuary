import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePositiveInt } from "./numberParsing";

describe("parsePositiveInt", () => {
  it("returns null for null and empty values", () => {
    assert.equal(parsePositiveInt(null), null);
    assert.equal(parsePositiveInt(""), null);
    assert.equal(parsePositiveInt("   "), null);
  });

  it("returns null for non-digit strings", () => {
    assert.equal(parsePositiveInt("1.2"), null);
    assert.equal(parsePositiveInt("-1"), null);
    assert.equal(parsePositiveInt("0"), null);
    assert.equal(parsePositiveInt("abc"), null);
    assert.equal(parsePositiveInt("1e2"), null);
    assert.equal(parsePositiveInt("0x10"), null);
    assert.equal(parsePositiveInt("+10"), null);
  });

  it("parses positive integer strings", () => {
    assert.equal(parsePositiveInt("1"), 1);
    assert.equal(parsePositiveInt("42"), 42);
    assert.equal(parsePositiveInt("0007"), 7);
    assert.equal(parsePositiveInt(" 9 "), 9);
  });
});
