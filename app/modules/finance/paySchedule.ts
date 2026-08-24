import { formatDateKey, getChargeDatesInRange, parseDateKey } from "~/modules/finance/recurrence";

export type PayScheduleType = "semi-monthly";
export type SecondPaydayRule = "last-day";
export type WeekendAdjustment = "previous-friday" | "none";

export interface PrimaryPaySchedule {
  isEnabled?: number | boolean;
  scheduleType?: string | null;
  firstNominalDay?: number | null;
  secondPaydayRule?: string | null;
  weekendAdjustment?: string | null;
  netPaycheckAmountCents?: number | null;
  depositAccountId?: number | null;
}

export interface CashFlowExpense {
  id: number;
  name: string;
  monthlyCost: number;
  isActive: number;
  recurrenceFrequency?: string | null;
  recurrenceAnchor?: string | Date | null;
  chargeDay?: number | null;
  lastDayOfMonth?: number | boolean | null;
}

export interface ScheduledBill {
  expenseId: number;
  name: string;
  chargeDate: string;
  amountCents: number;
}

const DAY_MS = 86_400_000;

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function adjustWeekend(date: Date, rule: string | null | undefined): Date {
  if (rule !== "previous-friday") return date;
  const day = date.getUTCDay();
  return day === 6 ? new Date(date.getTime() - DAY_MS) : day === 0 ? new Date(date.getTime() - 2 * DAY_MS) : date;
}

/** Derives actual dates for one month; nominal dates are intentionally not persisted as occurrences. */
export function getSemiMonthlyPayDatesForMonth(schedule: PrimaryPaySchedule, year: number, month: number): Date[] {
  const firstDay = Math.min(Math.max(schedule.firstNominalDay ?? 15, 1), daysInMonth(year, month));
  const first = adjustWeekend(new Date(Date.UTC(year, month, firstDay)), schedule.weekendAdjustment);
  const second = adjustWeekend(new Date(Date.UTC(year, month, daysInMonth(year, month))), schedule.weekendAdjustment);
  return [first, second].sort((a, b) => a.getTime() - b.getTime());
}

export function getPayDatesAfter(schedule: PrimaryPaySchedule, referenceDate: Date, count: number): Date[] {
  const reference = parseDateKey(referenceDate);
  const dates: Date[] = [];
  let year = reference.getUTCFullYear();
  let month = reference.getUTCMonth();
  while (dates.length < count) {
    for (const date of getSemiMonthlyPayDatesForMonth(schedule, year, month)) {
      if (date >= reference) dates.push(date);
      if (dates.length === count) return dates;
    }
    month += 1;
    if (month === 12) { month = 0; year += 1; }
  }
  return dates;
}

export function getReferenceDateKey(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

/** Uses a configured net amount, or annual gross less taxes divided across 24 semi-monthly paychecks. */
export function getExpectedPaycheckCents(schedule: PrimaryPaySchedule, annualGrossIncome: number | null | undefined, taxDeductionPercentage: number | null | undefined) {
  if (schedule.netPaycheckAmountCents != null) return { amountCents: schedule.netPaycheckAmountCents, isEstimate: false };
  const annualGrossCents = (annualGrossIncome ?? 0) * 100;
  const annualNetCents = Math.round(annualGrossCents * (1 - (taxDeductionPercentage ?? 0) / 100));
  return { amountCents: Math.round(annualNetCents / 24), isEstimate: true };
}

/** Half-open pay-period allocation: bills on the payday are funded by that paycheck. */
export function getScheduledBillsInPayPeriod(expenses: CashFlowExpense[], payDate: Date, nextPayDate: Date): ScheduledBill[] {
  const through = new Date(nextPayDate.getTime() - DAY_MS);
  return expenses.flatMap((expense) => expense.isActive === 0 ? [] : getChargeDatesInRange(expense, payDate, through).map((chargeDate) => ({ expenseId: expense.id, name: expense.name, chargeDate: formatDateKey(chargeDate), amountCents: expense.monthlyCost }))).sort((a, b) => a.chargeDate.localeCompare(b.chargeDate) || a.name.localeCompare(b.name));
}

export function getBillsBeforePayday(expenses: CashFlowExpense[], referenceDate: Date, nextPayDate: Date) {
  return getScheduledBillsInPayPeriod(expenses, referenceDate, nextPayDate);
}
