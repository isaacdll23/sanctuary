import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveReference } from "./referenceResolution";

const expenses = [
  { id: 1, name: "Rent" },
  { id: 2, name: "Netflix" },
  { id: 3, name: "Netflix Family" },
  { id: 4, name: "Phone" },
  { id: 5, name: "Gym" },
  { id: 6, name: "gym" },
];

describe("resolveReference", () => {
  it("resolves by explicit id", () => {
    const result = resolveReference(expenses, { id: 3 }, "expense");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.name, "Netflix Family");
  });

  it("reports a missing id without falling back to the name", () => {
    const result = resolveReference(
      expenses,
      { id: 99, name: "Rent" },
      "expense"
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /id 99/);
  });

  it("matches an exact name case-insensitively", () => {
    const result = resolveReference(expenses, { name: "  netflix " }, "expense");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.id, 2);
  });

  it("prefers an exact match over a substring match", () => {
    const result = resolveReference(expenses, { name: "Netflix" }, "expense");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.id, 2);
  });

  it("falls back to a substring match when there is no exact one", () => {
    const result = resolveReference(expenses, { name: "phone" }, "expense");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.id, 4);
  });

  it("returns candidates instead of guessing an ambiguous name", () => {
    const result = resolveReference(
      expenses,
      { name: "GYM" },
      "expense"
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(
        result.candidates?.map((candidate) => candidate.id),
        [5, 6]
      );
    }
  });

  it("returns every candidate when a substring matches several records", () => {
    const result = resolveReference(expenses, { name: "net" }, "expense");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(
        result.candidates?.map((candidate) => candidate.id),
        [2, 3]
      );
    }
  });

  it("explains when nothing matches or no reference is given", () => {
    const missing = resolveReference(
      expenses,
      { name: "Storage Unit" },
      "expense"
    );
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.match(missing.error, /No expense matches/);

    const empty = resolveReference(expenses, {}, "expense");
    assert.equal(empty.ok, false);
    if (!empty.ok) assert.match(empty.error, /id or name/);
  });
});
