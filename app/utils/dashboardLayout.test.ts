import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeDashboardLayout } from "./dashboardLayout";

const ALL = { hasTasks: true, hasDayPlanner: true, hasNotes: true };

describe("computeDashboardLayout header quick links", () => {
  it("hides the Task quick link when the user lacks tasks access", () => {
    const layout = computeDashboardLayout({ ...ALL, hasTasks: false });
    assert.equal(
      layout.headerQuickLinks.some((link) => link.href === "/tasks"),
      false,
      "A user without tasks access must not get a Task quick link"
    );
  });

  it("hides the Note quick link when the user lacks notes access", () => {
    const layout = computeDashboardLayout({ ...ALL, hasNotes: false });
    assert.equal(
      layout.headerQuickLinks.some((link) => link.href === "/notes"),
      false,
      "A user without notes access must not get a Note quick link"
    );
  });

  it("shows no header quick links when the user has neither tasks nor notes", () => {
    const layout = computeDashboardLayout({
      hasTasks: false,
      hasDayPlanner: false,
      hasNotes: false,
    });
    assert.deepEqual(
      layout.headerQuickLinks,
      [],
      "No access should mean no quick links"
    );
  });
});

describe("computeDashboardLayout velocity ring", () => {
  it("does not render the velocity ring when the day planner is unavailable", () => {
    const layout = computeDashboardLayout({
      hasTasks: true,
      hasDayPlanner: false,
      hasNotes: true,
    });
    assert.equal(
      layout.showVelocityRing,
      false,
      "planned/completed counts are only produced by the day planner, so the ring is meaningless without it"
    );
  });

  it("still shows the focus hub for a tasks-only user, without the ring", () => {
    const layout = computeDashboardLayout({
      hasTasks: true,
      hasDayPlanner: false,
      hasNotes: false,
    });
    assert.equal(layout.showFocusHub, true);
    assert.equal(layout.showVelocityRing, false);
  });
});

describe("computeDashboardLayout section visibility", () => {
  it("shows recent notes only with notes access", () => {
    assert.equal(computeDashboardLayout({ ...ALL, hasNotes: false }).showRecentNotes, false);
    assert.equal(computeDashboardLayout({ ...ALL, hasNotes: true }).showRecentNotes, true);
  });

  it("shows upcoming tasks only with tasks access", () => {
    assert.equal(computeDashboardLayout({ ...ALL, hasTasks: false }).showUpcomingTasks, false);
    assert.equal(computeDashboardLayout({ ...ALL, hasTasks: true }).showUpcomingTasks, true);
  });

  it("shows the day planner CTA only with day planner access", () => {
    assert.equal(
      computeDashboardLayout({ ...ALL, hasDayPlanner: false }).showDayPlannerCta,
      false
    );
    assert.equal(
      computeDashboardLayout({ ...ALL, hasDayPlanner: true }).showDayPlannerCta,
      true
    );
  });
});