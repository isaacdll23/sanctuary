import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AccountBalanceSnapshot } from "~/types/expense";
import { describeBalanceAge, getDaysSince, summarizeBalances } from "./balances";

function snapshot(overrides: Partial<AccountBalanceSnapshot> & Pick<AccountBalanceSnapshot, "accountId" | "balanceDate" | "balanceCents">): AccountBalanceSnapshot {
  return { id: 1, userId: 1, createdAt: new Date(0), updatedAt: new Date(0), ...overrides };
}

describe("balance summaries", () => {
  it("keeps the newest snapshot per account from newest-first loader data", () => {
    const snapshots = [
      snapshot({ id: 3, accountId: 1, balanceDate: "2026-08-30", balanceCents: 50_000 }),
      snapshot({ id: 2, accountId: 2, balanceDate: "2026-08-30", balanceCents: 10_000 }),
      snapshot({ id: 1, accountId: 1, balanceDate: "2026-08-15", balanceCents: 90_000 }),
    ];
    const summary = summarizeBalances(snapshots);
    assert.equal(summary.latestByAccount.get(1)?.balanceCents, 50_000);
    assert.equal(summary.latestByAccount.get(2)?.balanceCents, 10_000);
    assert.equal(summary.totalBalanceCents, 60_000);
    assert.equal(summary.oldestBalanceDate, "2026-08-30");
  });

  it("handles empty input and negative balances", () => {
    assert.deepEqual(summarizeBalances([]), { latestByAccount: new Map(), totalBalanceCents: 0, oldestBalanceDate: null });
    const summary = summarizeBalances([snapshot({ accountId: 1, balanceDate: "2026-08-30", balanceCents: -4_210 })]);
    assert.equal(summary.totalBalanceCents, -4_210);
  });

  it("counts whole days between date keys for staleness", () => {
    assert.equal(getDaysSince("2026-08-30", "2026-08-31"), 1);
    assert.equal(getDaysSince("2026-08-31", "2026-08-31"), 0);
    assert.equal(getDaysSince("2026-09-01", "2026-08-31"), -1);
  });

  it("describes balance ages without scolding", () => {
    assert.equal(describeBalanceAge(0), "checked today");
    assert.equal(describeBalanceAge(1), "checked yesterday");
    assert.equal(describeBalanceAge(6), "checked 6 days ago");
  });
});
