import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { generateNoteTitle, isAiConfigured, resolveModel } from "./ai.server";

const originalApiKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalApiKey;
  }
});

describe("AI configuration", () => {
  it("reports configured only when a non-blank API key is present", () => {
    assert.equal(isAiConfigured({}), false);
    assert.equal(isAiConfigured({ OPENAI_API_KEY: "   " }), false);
    assert.equal(isAiConfigured({ OPENAI_API_KEY: "sk-test" }), true);
  });

  it("resolves a per-feature model before the default", () => {
    assert.equal(resolveModel("note-title", {}), "gpt-6-luna");
    assert.equal(resolveModel("note-title", { OPENAI_MODEL: "gpt-5" }), "gpt-5");
    assert.equal(
      resolveModel("note-title", {
        OPENAI_MODEL: "gpt-5",
        OPENAI_MODEL_NOTE_TITLE: "gpt-5-mini",
      }),
      "gpt-5-mini"
    );
    assert.equal(
      resolveModel("note-title", { OPENAI_MODEL_NOTE_TITLE: "  " }),
      "gpt-6-luna"
    );
  });

  it("resolves the assistant feature override independently", () => {
    assert.equal(resolveModel("assistant", {}), "gpt-6-luna");
    assert.equal(
      resolveModel("assistant", {
        OPENAI_MODEL: "gpt-5",
        OPENAI_MODEL_ASSISTANT: "gpt-5-mini",
      }),
      "gpt-5-mini"
    );
  });
});

describe("generateNoteTitle", () => {
  it("rejects empty content before reaching the provider", async () => {
    await assert.rejects(() => generateNoteTitle("   "), /empty/);
  });

  it("rejects when AI is not configured", async () => {
    delete process.env.OPENAI_API_KEY;
    await assert.rejects(
      () => generateNoteTitle("Some note content"),
      /not configured/
    );
  });
});
