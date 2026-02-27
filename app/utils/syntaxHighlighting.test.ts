import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getTokenClass, highlightSyntax } from "./syntaxHighlighting";

describe("syntaxHighlighting", () => {
  it("highlights JSON content with JSON token types", () => {
    const tokens = highlightSyntax('{"name":"Isaac","count":2,"active":true}');
    const types = new Set(tokens.map((t) => t.type));

    assert.equal(types.has("json-key"), true);
    assert.equal(types.has("json-string"), true);
    assert.equal(types.has("json-number"), true);
    assert.equal(types.has("json-boolean"), true);
  });

  it("highlights code content with code token types", () => {
    const tokens = highlightSyntax("const n = 1; // note");
    const types = new Set(tokens.map((t) => t.type));

    assert.equal(types.has("code-keyword"), true);
    assert.equal(types.has("code-number"), true);
    assert.equal(types.has("code-comment"), true);
  });

  it("highlights markdown content with markdown token types", () => {
    const tokens = highlightSyntax("# Title\n**bold** and [link](example)");
    const types = new Set(tokens.map((t) => t.type));

    assert.equal(types.has("markdown-heading"), true);
    assert.equal(types.has("markdown-bold"), true);
    assert.equal(types.has("markdown-link"), true);
  });

  it("returns class names for known token types", () => {
    assert.notEqual(getTokenClass("json-key"), "");
    assert.notEqual(getTokenClass("code-keyword"), "");
    assert.equal(getTokenClass("text"), "");
  });
});
