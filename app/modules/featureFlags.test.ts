import { test } from "node:test";
import assert from "node:assert/strict";
import {
  featureIdForPageId,
  filterEnabledFeatures,
  isFeatureAvailable,
  isFeatureId,
  parseFeatureOverrides,
  platformAvailableFeatureIds,
  resolveFeatureEnabled,
  USER_TOGGLEABLE_FEATURES,
} from "./featureFlags";

test("platform defaults mark disabled features as unavailable", () => {
  assert.equal(isFeatureAvailable("tasks"), false);
  assert.equal(isFeatureAvailable("day-planner"), false);
  assert.equal(isFeatureAvailable("shared-budgets"), false);
  assert.equal(isFeatureAvailable("utilities/commands"), false);
  assert.equal(isFeatureAvailable("finance"), true);
  assert.equal(isFeatureAvailable("notes"), true);
  assert.equal(isFeatureAvailable("dashboard"), true);
  assert.equal(isFeatureAvailable("settings"), true);
  assert.equal(isFeatureAvailable("admin"), true);
});

test("resolveFeatureEnabled falls back to the platform default without overrides", () => {
  assert.equal(resolveFeatureEnabled("tasks", null), false);
  assert.equal(resolveFeatureEnabled("tasks", {}), false);
  assert.equal(resolveFeatureEnabled("finance", {}), true);
  assert.equal(resolveFeatureEnabled("notes", null), true);
});

test("resolveFeatureEnabled lets a user override win over the platform default", () => {
  // Re-enable a platform-disabled feature for one user
  assert.equal(
    resolveFeatureEnabled("tasks", { tasks: "enabled" }),
    true
  );

  // Hide a platform-enabled feature for one user
  assert.equal(
    resolveFeatureEnabled("notes", { notes: "disabled" }),
    false
  );

  // Overrides for other features do not leak across
  assert.equal(
    resolveFeatureEnabled("notes", { tasks: "disabled" }),
    true
  );
});

test("filterEnabledFeatures removes only disabled feature IDs", () => {
  const filtered = filterEnabledFeatures([
    "tasks",
    "notes",
    "day-planner",
    "finance",
    "commands",
  ]);

  assert.deepEqual(filtered.sort(), ["commands", "finance", "notes"]);
});

test("filterEnabledFeatures applies per-user overrides", () => {
  const filtered = filterEnabledFeatures(
    ["tasks", "notes", "shared-budgets"],
    { tasks: "enabled", "shared-budgets": "disabled" }
  );

  assert.deepEqual(filtered.sort(), ["notes", "tasks"]);
});

test("filterEnabledFeatures passes through unknown page IDs", () => {
  assert.deepEqual(filterEnabledFeatures(["logout", "custom-page"]), [
    "logout",
    "custom-page",
  ]);
});

test("filterEnabledFeatures keeps finance when shared budgets are disabled", () => {
  assert.deepEqual(filterEnabledFeatures(["finance", "shared-budgets"]), [
    "finance",
  ]);
});

test("featureIdForPageId maps route pageIds to feature IDs", () => {
  assert.equal(featureIdForPageId("commands"), "utilities/commands");
  assert.equal(featureIdForPageId("utilities/commands"), "utilities/commands");
  assert.equal(featureIdForPageId("day-planner"), "day-planner");
  assert.equal(featureIdForPageId("finance"), "finance");
});

test("featureIdForPageId returns null for ungated page IDs", () => {
  assert.equal(featureIdForPageId("logout"), null);
  assert.equal(featureIdForPageId("something-else"), null);
});

test("parseFeatureOverrides keeps known features with valid values", () => {
  assert.deepEqual(
    parseFeatureOverrides({ tasks: "enabled", notes: "disabled" }),
    { tasks: "enabled", notes: "disabled" }
  );
});

test("parseFeatureOverrides drops unknown features and values", () => {
  assert.deepEqual(
    parseFeatureOverrides({
      tasks: "enabled",
      "made-up-feature": "enabled",
      notes: "banana",
      finance: 42,
    }),
    { tasks: "enabled" }
  );
});

test("parseFeatureOverrides rejects non-object input", () => {
  assert.deepEqual(parseFeatureOverrides(null), {});
  assert.deepEqual(parseFeatureOverrides(undefined), {});
  assert.deepEqual(parseFeatureOverrides("tasks"), {});
  assert.deepEqual(parseFeatureOverrides(["tasks"]), {});
  assert.deepEqual(parseFeatureOverrides(42), {});
});

test("user-toggleable features have unique, known IDs", () => {
  const ids = USER_TOGGLEABLE_FEATURES.map((feature) => feature.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.ok(isFeatureId(id));
  }
});

test("platformAvailableFeatureIds reflects the platform default", () => {
  const available = platformAvailableFeatureIds();
  assert.ok(available.includes("finance"));
  assert.ok(!available.includes("tasks"));
});
