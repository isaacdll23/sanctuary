import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assistantProviderOptions,
  buildAssistantInstructions,
} from "./agent.server";

describe("buildAssistantInstructions", () => {
  it("injects the current time in the user's time zone", () => {
    const instructions = buildAssistantInstructions({
      timeZone: "America/Los_Angeles",
      now: new Date("2026-10-11T20:23:00Z"),
      asOfDate: "2026-10-11",
    });
    // ICU inserts narrow no-break spaces around the day period.
    const normalized = instructions.replace(/[\u202f\u00a0]/g, " ");

    assert.match(normalized, /Current date and time: Sunday, October 11, 2026/);
    assert.match(normalized, /1:23 PM/);
    assert.match(normalized, /User time zone: America\/Los_Angeles/);
    assert.match(normalized, /Today's date: 2026-10-11/);
  });
});

describe("assistantProviderOptions", () => {
  it("maps the effort to the OpenAI provider option", () => {
    assert.deepEqual(assistantProviderOptions("low"), {
      openai: { reasoningEffort: "low" },
    });
    assert.deepEqual(assistantProviderOptions("high"), {
      openai: { reasoningEffort: "high" },
    });
  });
});
