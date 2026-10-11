import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { UIMessage } from "ai";
import {
  chatRequestSchema,
  deriveConversationTitle,
  firstUserMessageText,
} from "./conversation";

function message(role: UIMessage["role"], text: string): UIMessage {
  return {
    id: "message-1",
    role,
    parts: text ? [{ type: "text", text }] : [],
  };
}

describe("deriveConversationTitle", () => {
  it("uses the first user message as the title", () => {
    assert.equal(
      deriveConversationTitle([message("user", "How much do I spend?")]),
      "How much do I spend?"
    );
  });

  it("collapses whitespace", () => {
    assert.equal(
      deriveConversationTitle([message("user", "  hello   world \n")]),
      "hello world"
    );
  });

  it("skips assistant messages and falls back when there is no user text", () => {
    assert.equal(deriveConversationTitle([]), "New chat");
    assert.equal(deriveConversationTitle([message("assistant", "hi")]), "New chat");
    assert.equal(deriveConversationTitle([message("user", "")]), "New chat");
  });

  it("truncates a long prompt at a word boundary", () => {
    const title = deriveConversationTitle([message("user", "word ".repeat(40))]);
    assert.ok(title.length <= 61, `expected <= 61 chars, got ${title.length}`);
    assert.ok(title.endsWith("…"));
    assert.ok(!title.includes("  "));
  });
});

describe("firstUserMessageText", () => {
  it("returns the normalized text of the first user message", () => {
    assert.equal(
      firstUserMessageText([
        message("assistant", "hi"),
        message("user", "  Plan   my month\n"),
      ]),
      "Plan my month"
    );
  });

  it("returns an empty string when there is no user text", () => {
    assert.equal(firstUserMessageText([]), "");
    assert.equal(firstUserMessageText([message("assistant", "hi")]), "");
    assert.equal(firstUserMessageText([message("user", "")]), "");
  });
});

describe("chatRequestSchema", () => {
  it("accepts a well-formed request", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: "AbC123",
      messages: [{ id: "1", role: "user", parts: [] }],
    });
    assert.equal(result.success, true);
  });

  it("rejects ids with unsafe characters", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: "../etc/passwd",
      messages: [{ id: "1", role: "user", parts: [] }],
    });
    assert.equal(result.success, false);
  });

  it("requires at least one message", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: "AbC123",
      messages: [],
    });
    assert.equal(result.success, false);
  });
});
