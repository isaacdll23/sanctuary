import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasReasoningText } from "./reasoning";

describe("hasReasoningText", () => {
  it("accepts reasoning text with content", () => {
    assert.equal(hasReasoningText("I should check the balance first."), true);
  });

  it("rejects empty or whitespace-only text", () => {
    assert.equal(hasReasoningText(""), false);
    assert.equal(hasReasoningText("   \n\t "), false);
  });

  it("rejects missing text from an encrypted-only reasoning part", () => {
    assert.equal(hasReasoningText(undefined), false);
    assert.equal(hasReasoningText(null), false);
  });
});
