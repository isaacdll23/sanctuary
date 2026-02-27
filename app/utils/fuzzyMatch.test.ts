import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fuzzyMatch } from "./fuzzyMatch";

describe("fuzzyMatch", () => {
  it("matches when pattern is empty", () => {
    assert.equal(fuzzyMatch("sanctuary", ""), true);
  });

  it("matches case-insensitive substrings", () => {
    assert.equal(fuzzyMatch("Shared Budget", "budget"), true);
    assert.equal(fuzzyMatch("Shared Budget", "SHARED"), true);
  });

  it("matches character subsequences", () => {
    assert.equal(fuzzyMatch("sanctuary", "scty"), true);
    assert.equal(fuzzyMatch("google calendar", "ggl"), true);
  });

  it("matches near-typos with levenshtein threshold", () => {
    assert.equal(fuzzyMatch("command", "comand"), true);
  });

  it("does not match unrelated patterns", () => {
    assert.equal(fuzzyMatch("command", "xyz"), false);
  });
});
