import type { AccountBalanceSnapshot } from "~/types/expense";
import { parseDateKey } from "./recurrence";
import { formatMoney } from "~/utils/money";

const MS_PER_DAY = 86_400_000;

export interface BalanceSummaryView {
  /** Newest snapshot per account; the loader returns snapshots newest-first. */
  latestByAccount: Map<number, AccountBalanceSnapshot>;
  totalBalanceCents: number;
  /** Oldest latest-snapshot date across accounts, for staleness display. */
  oldestBalanceDate: string | null;
}

/** Newest snapshot per account; snapshots arrive newest-first from the loader. */
export function getLatestBalanceByAccount(snapshots: AccountBalanceSnapshot[]): Map<number, AccountBalanceSnapshot> {
  const latestByAccount = new Map<number, AccountBalanceSnapshot>();
  for (const snapshot of snapshots) {
    if (!latestByAccount.has(snapshot.accountId)) latestByAccount.set(snapshot.accountId, snapshot);
  }
  return latestByAccount;
}

/** Summarizes balance check-ins: current balance per account, total, and staleness. */
export function summarizeBalances(snapshots: AccountBalanceSnapshot[]): BalanceSummaryView {
  const latestByAccount = getLatestBalanceByAccount(snapshots);
  let oldest: AccountBalanceSnapshot | undefined;
  for (const snapshot of latestByAccount.values()) {
    if (!oldest || snapshot.balanceDate < oldest.balanceDate) oldest = snapshot;
  }
  const totalBalanceCents = [...latestByAccount.values()].reduce((sum, snapshot) => sum + snapshot.balanceCents, 0);
  return { latestByAccount, totalBalanceCents, oldestBalanceDate: oldest?.balanceDate ?? null };
}

/** Whole days between two date keys; positive when `dateKey` is before `asOfDate`. */
export function getDaysSince(dateKey: string, asOfDate: string): number {
  return Math.round((parseDateKey(asOfDate).getTime() - parseDateKey(dateKey).getTime()) / MS_PER_DAY);
}

export function describeBalanceAge(days: number): string {
  if (days <= 0) return "checked today";
  if (days === 1) return "checked yesterday";
  return `checked ${days} day${days === 1 ? "" : "s"} ago`;
}

/** Formats a signed amount with the currency symbol inside the sign: -$150.00, not $-150.00. */
export function formatSignedMoney(cents: number): string {
  return `${cents < 0 ? "-" : ""}$${formatMoney(Math.abs(cents))}`;
}
