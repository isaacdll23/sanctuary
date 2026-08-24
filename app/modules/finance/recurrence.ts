export type ExpenseFrequency = "monthly" | "weekly" | "biweekly" | "quarterly" | "yearly";

export interface RecurringExpenseInput {
  monthlyCost: number;
  recurrenceFrequency?: string | null;
  recurrenceAnchor?: string | Date | null;
  chargeDay?: number | null;
  lastDayOfMonth?: number | boolean | null;
}

const MS_PER_DAY = 86_400_000;

export const frequencyLabels: Record<ExpenseFrequency, string> = {
  monthly: "Monthly",
  weekly: "Weekly",
  biweekly: "Every two weeks",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export function asExpenseFrequency(value: string | null | undefined): ExpenseFrequency {
  return value === "weekly" || value === "biweekly" || value === "quarterly" || value === "yearly" ? value : "monthly";
}

export function parseDateKey(value: string | Date | null | undefined): Date {
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  throw new Error("A valid recurrence anchor date is required.");
}

export function formatDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function monthlyOccurrence(year: number, monthIndex: number, input: RecurringExpenseInput, anchor: Date): Date {
  const lastDay = input.lastDayOfMonth === true || input.lastDayOfMonth === 1;
  const day = lastDay ? daysInMonth(year, monthIndex) : Math.min(input.chargeDay ?? anchor.getUTCDate(), daysInMonth(year, monthIndex));
  return new Date(Date.UTC(year, monthIndex, day));
}

function addMonths(date: Date, months: number): Date {
  const totalMonths = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  return new Date(Date.UTC(Math.floor(totalMonths / 12), totalMonths % 12, 1));
}

/** Returns the next scheduled date on or after `from`; it is derived rather than persisted. */
export function getNextChargeDate(input: RecurringExpenseInput, from: Date = new Date()): Date {
  const anchor = parseDateKey(input.recurrenceAnchor ?? "2000-01-01");
  const current = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const frequency = asExpenseFrequency(input.recurrenceFrequency);

  if (frequency === "weekly" || frequency === "biweekly") {
    const interval = frequency === "weekly" ? 7 : 14;
    const daysSinceAnchor = Math.floor((current.getTime() - anchor.getTime()) / MS_PER_DAY);
    const intervals = Math.max(0, Math.ceil(daysSinceAnchor / interval));
    return new Date(anchor.getTime() + intervals * interval * MS_PER_DAY);
  }

  const intervalMonths = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
  const monthsSinceAnchor = (current.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + current.getUTCMonth() - anchor.getUTCMonth();
  let step = Math.max(0, Math.floor(monthsSinceAnchor / intervalMonths));
  let candidateMonth = addMonths(anchor, step * intervalMonths);
  let candidate = monthlyOccurrence(candidateMonth.getUTCFullYear(), candidateMonth.getUTCMonth(), input, anchor);
  if (candidate < current) {
    step += 1;
    candidateMonth = addMonths(anchor, step * intervalMonths);
    candidate = monthlyOccurrence(candidateMonth.getUTCFullYear(), candidateMonth.getUTCMonth(), input, anchor);
  }
  return candidate;
}

/** Returns every scheduled charge in an inclusive UTC date range. */
export function getChargeDatesInRange(
  input: RecurringExpenseInput,
  from: Date,
  through: Date
): Date[] {
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(through.getUTCFullYear(), through.getUTCMonth(), through.getUTCDate()));
  if (end < start) return [];

  const dates: Date[] = [];
  let next = getNextChargeDate(input, start);
  while (next <= end) {
    dates.push(next);
    next = getNextChargeDate(input, new Date(next.getTime() + MS_PER_DAY));
  }
  return dates;
}

/** Normalizes each recurring amount from its annual cadence. Rounding occurs once, in cents. */
export function getNormalizedYearlyCostCents(input: RecurringExpenseInput): number {
  const multiplier: Record<ExpenseFrequency, number> = { weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, yearly: 1 };
  return input.monthlyCost * multiplier[asExpenseFrequency(input.recurrenceFrequency)];
}

export function getNormalizedMonthlyCostCents(input: RecurringExpenseInput): number {
  return Math.round(getNormalizedYearlyCostCents(input) / 12);
}

export function getRecurrenceDescription(input: RecurringExpenseInput): string {
  const frequency = asExpenseFrequency(input.recurrenceFrequency);
  if (frequency === "monthly") return input.lastDayOfMonth === true || input.lastDayOfMonth === 1 ? "Monthly on the last day" : `Monthly on day ${input.chargeDay ?? parseDateKey(input.recurrenceAnchor).getUTCDate()}`;
  return frequencyLabels[frequency];
}
