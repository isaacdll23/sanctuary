import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MOBILE_TAB_IDS,
  MOBILE_TAB_LIMIT,
  normalizeMobileTabIds,
  parseMobileTabIdsInput,
  parseNavigationPreferences,
} from "./navigation";

test("normalizeMobileTabIds keeps order, drops duplicates and unknown ids", () => {
  assert.deepEqual(
    normalizeMobileTabIds(["notes", "bogus", "tasks", "notes"]),
    ["notes", "tasks"]
  );
});

test("normalizeMobileTabIds caps the list at the mobile tab limit", () => {
  const ids = [
    "dashboard",
    "tasks",
    "notes",
    "day-planner",
    "finance",
    "settings",
  ];
  assert.equal(normalizeMobileTabIds(ids).length, MOBILE_TAB_LIMIT);
});

test("parseNavigationPreferences falls back to defaults on invalid input", () => {
  assert.deepEqual(parseNavigationPreferences(null).mobileTabIds, DEFAULT_MOBILE_TAB_IDS);
  assert.deepEqual(parseNavigationPreferences("tasks").mobileTabIds, DEFAULT_MOBILE_TAB_IDS);
  assert.deepEqual(parseNavigationPreferences({}).mobileTabIds, DEFAULT_MOBILE_TAB_IDS);
  assert.deepEqual(
    parseNavigationPreferences({ mobileTabIds: "tasks" }).mobileTabIds,
    DEFAULT_MOBILE_TAB_IDS
  );
  assert.deepEqual(
    parseNavigationPreferences({ mobileTabIds: [] }).mobileTabIds,
    DEFAULT_MOBILE_TAB_IDS
  );
});

test("parseNavigationPreferences keeps valid ids and drops invalid ones", () => {
  assert.deepEqual(
    parseNavigationPreferences({
      mobileTabIds: ["finance", 42, "bogus", "notes", "notes"],
    }).mobileTabIds,
    ["finance", "notes"]
  );
});

test("parseMobileTabIdsInput accepts a valid ordered list", () => {
  const parsed = parseMobileTabIdsInput("tasks, notes ,finance");
  assert.equal(parsed.ok, true);
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.tabIds, ["tasks", "notes", "finance"]);
});

test("parseMobileTabIdsInput rejects empty selections", () => {
  const parsed = parseMobileTabIdsInput(" , ");
  assert.equal(parsed.ok, false);
  assert.ok(!parsed.ok);
  assert.match(parsed.error, /at least one tab/i);
});

test("parseMobileTabIdsInput rejects unknown page ids", () => {
  const parsed = parseMobileTabIdsInput("tasks,bogus");
  assert.equal(parsed.ok, false);
  assert.ok(!parsed.ok);
  assert.match(parsed.error, /bogus/);
});

test("parseMobileTabIdsInput rejects duplicates", () => {
  const parsed = parseMobileTabIdsInput("tasks,tasks");
  assert.equal(parsed.ok, false);
  assert.ok(!parsed.ok);
  assert.match(parsed.error, /once/i);
});

test("parseMobileTabIdsInput rejects more tabs than the limit", () => {
  const parsed = parseMobileTabIdsInput("dashboard,tasks,notes,day-planner,finance");
  assert.equal(parsed.ok, false);
  assert.ok(!parsed.ok);
  assert.match(parsed.error, new RegExp(`at most ${MOBILE_TAB_LIMIT}`, "i"));
});

test("parseMobileTabIdsInput never accepts logout as a pinned tab", () => {
  const parsed = parseMobileTabIdsInput("tasks,logout");
  assert.equal(parsed.ok, false);
});
