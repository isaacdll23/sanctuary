import { tool } from "ai";
import { z } from "zod";
import type {
  Expense,
  ExpenseActionResult,
  ExpenseFormErrors,
} from "~/types/expense";
import type { IncomeFormErrors } from "~/types/income";
import {
  dateKeySchema,
  expenseWriteSchema,
  expenseWriteToFields,
  getBalanceSnapshotsForUser,
  getExpenseChargesForUser,
  getExpensesForUser,
  getPaymentAccountsForUser,
  normalizeExpenseCategory,
  type ExpenseWriteInput,
} from "~/modules/services/ExpenseService";
import { getIncomeOverviewForUser, incomeWriteSchema, incomeWriteToFields } from "~/modules/services/IncomeService";
import {
  createExpense,
  createPaymentAccount,
  deleteExpense,
  deletePaymentAccount,
  logAccountBalance,
  recordExpenseCharge,
  removeExpenseCharge,
  saveIncome,
  setExpenseActive,
  updateExpense,
} from "~/modules/services/FinanceCommandService";
import { formatSignedMoney } from "~/modules/finance/balances";
import { filterAndSortExpenses } from "~/modules/finance/expenseFiltering";
import {
  resolveReference,
  type NamedOption,
} from "~/modules/finance/referenceResolution";
import {
  asExpenseFrequency,
  formatDateKey,
  getRecurrenceDescription,
  parseDateKey,
} from "~/modules/finance/recurrence";
import { getExpectedPaycheckCents } from "~/modules/finance/paySchedule";
import { formatMoney } from "~/utils/money";
import {
  buildBalanceSummary,
  buildExpenseSummary,
  buildIncomeOverview,
  buildPaymentAccountsView,
  buildUpcomingCashFlow,
  toExpenseView,
} from "./financeOverview";

export interface FinanceToolContext {
  /** Authenticated user; every query is scoped to this id. */
  userId: number;
  /** The user's local date key (`YYYY-MM-DD`), used for derived dates. */
  asOfDate: string;
}

const necessitySchema = z.enum(["essential", "discretionary"]);
const costTypeSchema = z.enum(["fixed", "variable"]);

/** A year of history covers paid-charge lookups and upcoming occurrences. */
function historySinceDate(asOfDate: string): string {
  return formatDateKey(
    new Date(parseDateKey(asOfDate).getTime() - 365 * 86_400_000)
  );
}

type PaymentAccount = Awaited<
  ReturnType<typeof getPaymentAccountsForUser>
>[number];

/** A compact, display-ready record returned by write tools for the chat receipt. */
interface FinanceToolEntity {
  kind: "expense" | "paymentAccount" | "charge" | "balance" | "income";
  id?: number;
  label: string;
  detail?: string;
}

/** An ambiguous name match the model must disambiguate before writing. */
interface FinanceCandidate {
  id: number;
  name: string;
  detail?: string;
}

type FinanceWriteFailure = {
  ok: false;
  error: string;
  fieldErrors?: ExpenseFormErrors | IncomeFormErrors;
  candidates?: FinanceCandidate[];
};

type FinanceWriteResult =
  | { ok: true; message: string; entity?: FinanceToolEntity }
  | FinanceWriteFailure;

function money(cents: number): string {
  return `$${formatMoney(cents)}`;
}

function expenseDetail(expense: Expense): string {
  return `${money(expense.monthlyCost)} · ${getRecurrenceDescription(expense)}`;
}

function expenseCandidate(expense: Expense): FinanceCandidate {
  return {
    id: expense.id,
    name: expense.name,
    detail: expenseDetail(expense),
  };
}

function accountCandidate(account: NamedOption): FinanceCandidate {
  return { id: account.id, name: account.name };
}

function failure(result: {
  error: string;
  fieldErrors?: ExpenseFormErrors | IncomeFormErrors;
}): FinanceWriteFailure {
  return {
    ok: false,
    error: result.error,
    fieldErrors: result.fieldErrors,
  };
}

function writeResult(
  result: ExpenseActionResult,
  entity: FinanceToolEntity
): FinanceWriteResult {
  return result.ok
    ? { ok: true, message: result.message, entity }
    : failure(result);
}

const expenseLookupSchema = {
  expenseId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Expense id when known; preferred over expenseName."),
  expenseName: z
    .string()
    .optional()
    .describe("Expense name to look up when the id is unknown."),
};

const accountLookupSchema = {
  accountId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Payment account id when known; preferred over accountName."),
  accountName: z
    .string()
    .optional()
    .describe("Payment account name to look up when the id is unknown."),
};

/**
 * Merges a partial update onto an existing expense, then normalizes. Switching
 * away from a monthly schedule without giving an anchor falls back to today,
 * matching the expense form.
 */
function mergeExpenseWrite(
  existing: Expense,
  patch: Partial<ExpenseWriteInput>,
  asOfDate: string
): ExpenseWriteInput {
  const existingFrequency = asExpenseFrequency(existing.recurrenceFrequency);
  const leavingMonthly =
    patch.recurrenceFrequency != null &&
    patch.recurrenceFrequency !== "monthly" &&
    existingFrequency === "monthly";
  const recurrenceAnchor =
    patch.recurrenceAnchor ??
    (leavingMonthly ? asOfDate : existing.recurrenceAnchor);

  return {
    name: patch.name ?? existing.name,
    amount: patch.amount ?? existing.monthlyCost / 100,
    chargeDay: patch.chargeDay ?? existing.chargeDay,
    category: patch.category ?? existing.category,
    recurrenceFrequency: patch.recurrenceFrequency ?? existingFrequency,
    recurrenceAnchor,
    lastDayOfMonth: patch.lastDayOfMonth ?? existing.lastDayOfMonth !== 0,
    necessity:
      patch.necessity ??
      (existing.necessity === "discretionary" ? "discretionary" : "essential"),
    costType:
      patch.costType ?? (existing.costType === "variable" ? "variable" : "fixed"),
    paymentMethod:
      patch.paymentMethod ??
      (existing.paymentMethod === "manual" ? "manual" : "autopay"),
    accountId:
      patch.accountId !== undefined ? patch.accountId : existing.accountId,
    isActive: patch.isActive ?? existing.isActive !== 0,
  };
}

/**
 * Finance tools for the assistant. Reads never mutate; writes are scoped to the
 * authenticated user and delegate to `FinanceCommandService` so route forms and
 * the assistant share one set of ownership checks and result messages.
 */
export function createFinanceTools({ userId, asOfDate }: FinanceToolContext) {
  return {
    get_income_overview: tool({
      description:
        "Read the user's income: annual gross and net income, tax deduction percentage, and pay schedule (paydays, paycheck estimate, deposit account). Use this for any question about earnings or pay.",
      inputSchema: z.object({}),
      execute: async () => {
        const overview = await getIncomeOverviewForUser(userId);
        return buildIncomeOverview(overview, asOfDate);
      },
    }),

    list_expenses: tool({
      description:
        "List the user's recurring expenses (bills and subscriptions) with per-item detail: amount, recurrence, monthly/yearly equivalent, category, necessity, cost type, payment method, account, and next charge date. Supports the same filters as the Expenses page. Use this for itemized or filtered questions.",
      inputSchema: z.object({
        status: z
          .enum(["active", "paused", "all"])
          .optional()
          .describe(
            "Which expenses to include: only active (default), only paused, or all."
          ),
        search: z
          .string()
          .optional()
          .describe(
            "Case-insensitive text match against expense name or category."
          ),
        category: z
          .string()
          .optional()
          .describe("Restrict to one category, e.g. 'Housing'."),
        necessity: necessitySchema
          .optional()
          .describe("Restrict to essential or discretionary expenses."),
        costType: costTypeSchema
          .optional()
          .describe("Restrict to fixed or variable costs."),
        sort: z
          .enum(["nextCharge", "name", "monthlyCost"])
          .optional()
          .describe(
            "Result order: soonest next charge (default), name, or normalized monthly cost (high to low)."
          ),
      }),
      execute: async ({
        status = "active",
        search,
        category,
        necessity,
        costType,
        sort = "nextCharge",
      }) => {
        const [expenses, paymentAccounts] = await Promise.all([
          getExpensesForUser(userId),
          getPaymentAccountsForUser(userId),
        ]);
        const accountNames = new Map(
          paymentAccounts.map((account) => [account.id, account.name])
        );
        const wantedCategory =
          category != null ? normalizeExpenseCategory(category) : null;

        const filtered = filterAndSortExpenses(expenses, {
          categories: wantedCategory ? [wantedCategory] : [],
          searchQuery: search ?? "",
          status,
          sort,
          asOfDate,
        }).filter(
          (expense) =>
            (necessity == null || expense.necessity === necessity) &&
            (costType == null || expense.costType === costType)
        );

        return {
          currency: "USD" as const,
          count: filtered.length,
          expenses: filtered.map((expense) =>
            toExpenseView(
              expense,
              expense.accountId != null
                ? accountNames.get(expense.accountId) ?? null
                : null,
              asOfDate
            )
          ),
        };
      },
    }),

    get_expense_summary: tool({
      description:
        "Summarize the user's recurring expenses: total monthly and yearly cost, breakdowns by category, necessity, and cost type, plus net income remaining after those costs. Use this for 'how much do I spend' or 'what's left' questions instead of adding up list_expenses yourself.",
      inputSchema: z.object({}),
      execute: async () => {
        const [expenses, overview] = await Promise.all([
          getExpensesForUser(userId),
          getIncomeOverviewForUser(userId),
        ]);
        return buildExpenseSummary(expenses, overview.income);
      },
    }),

    list_payment_accounts: tool({
      description:
        "List the user's payment accounts with their latest manually recorded balance and how long ago it was checked. Balances come from user check-ins, not a bank sync. Use for questions about specific accounts.",
      inputSchema: z.object({}),
      execute: async () => {
        const [accounts, snapshots] = await Promise.all([
          getPaymentAccountsForUser(userId),
          getBalanceSnapshotsForUser(userId, "1970-01-01"),
        ]);
        return buildPaymentAccountsView(accounts, snapshots, asOfDate);
      },
    }),

    get_balance_summary: tool({
      description:
        "Summarize cash on hand: total current balance across accounts, how stale the balance check-ins are, and how much is committed to scheduled bills before the next payday. Use for 'what's my balance', 'can I afford this', or 'how much is left' questions.",
      inputSchema: z.object({}),
      execute: async () => {
        const [overview, expenses, snapshots] = await Promise.all([
          getIncomeOverviewForUser(userId),
          getExpensesForUser(userId),
          getBalanceSnapshotsForUser(userId, "1970-01-01"),
        ]);
        const chargeRecords = await getExpenseChargesForUser(
          userId,
          historySinceDate(asOfDate)
        );
        return buildBalanceSummary(
          expenses,
          chargeRecords,
          snapshots,
          overview.paySchedule,
          asOfDate
        );
      },
    }),

    get_upcoming_cash_flow: tool({
      description:
        "Show scheduled bill occurrences grouped into upcoming pay periods, with paid status and what remains from each expected paycheck. Requires a primary pay schedule; use list_expenses when none is configured.",
      inputSchema: z.object({
        periods: z
          .number()
          .int()
          .min(1)
          .max(4)
          .optional()
          .describe("How many upcoming pay periods to return (default 2)."),
      }),
      execute: async ({ periods = 2 }) => {
        const [overview, expenses] = await Promise.all([
          getIncomeOverviewForUser(userId),
          getExpensesForUser(userId),
        ]);
        const schedule = overview.paySchedule;

        if (!schedule || schedule.isEnabled === 0) {
          return {
            currency: "USD" as const,
            payScheduleEnabled: false,
            nextPayday: null,
            billsBeforeNextPayday: [],
            billsBeforeNextPaydayUsd: 0,
            periods: [],
          };
        }

        const chargeRecords = await getExpenseChargesForUser(
          userId,
          historySinceDate(asOfDate)
        );
        const expected = getExpectedPaycheckCents(
          schedule,
          overview.income?.annualGrossIncome,
          overview.income?.taxDeductionPercentage
        );
        return buildUpcomingCashFlow(
          schedule,
          expected,
          expenses,
          chargeRecords,
          asOfDate,
          periods
        );
      },
    }),

    create_expense: tool({
      description:
        "Add a recurring expense (bill or subscription) for the user.",
      inputSchema: expenseWriteSchema,
      execute: async (input) => {
        const fields = expenseWriteToFields(input);
        const result = await createExpense(userId, fields);
        return writeResult(result, {
          kind: "expense",
          label: fields.name,
          detail: `${money(fields.monthlyCost)} · ${getRecurrenceDescription(fields)}`,
        });
      },
    }),

    update_expense: tool({
      description:
        "Change one or more fields on an existing expense. Identify it by expenseId or expenseName; only the fields you pass are changed.",
      inputSchema: expenseWriteSchema.partial().extend(expenseLookupSchema),
      execute: async ({ expenseId, expenseName, ...patch }) => {
        const expenses = await getExpensesForUser(userId);
        const resolved = resolveReference(
          expenses,
          { id: expenseId, name: expenseName },
          "expense"
        );
        if (!resolved.ok) {
          return {
            ...failure(resolved),
            candidates: resolved.candidates?.map(expenseCandidate),
          };
        }

        const fields = expenseWriteToFields(
          mergeExpenseWrite(resolved.value, patch, asOfDate)
        );
        const result = await updateExpense(userId, resolved.value.id, fields);
        return writeResult(result, {
          kind: "expense",
          id: resolved.value.id,
          label: fields.name,
          detail: `${money(fields.monthlyCost)} · ${getRecurrenceDescription(fields)}`,
        });
      },
    }),

    set_expense_active: tool({
      description:
        "Pause or resume an expense. Paused expenses stay visible but are excluded from totals.",
      inputSchema: z.object({
        ...expenseLookupSchema,
        isActive: z
          .boolean()
          .describe("True to resume and include in totals; false to pause."),
      }),
      execute: async ({ expenseId, expenseName, isActive }) => {
        const expenses = await getExpensesForUser(userId);
        const resolved = resolveReference(
          expenses,
          { id: expenseId, name: expenseName },
          "expense"
        );
        if (!resolved.ok) {
          return {
            ...failure(resolved),
            candidates: resolved.candidates?.map(expenseCandidate),
          };
        }

        const result = await setExpenseActive(
          userId,
          resolved.value.id,
          isActive
        );
        return writeResult(result, {
          kind: "expense",
          id: resolved.value.id,
          label: resolved.value.name,
          detail: isActive ? "Active" : "Paused",
        });
      },
    }),

    delete_expense: tool({
      description:
        "Permanently delete an expense and its recorded charges. Confirm with the user before calling unless they explicitly asked to delete it.",
      inputSchema: z.object(expenseLookupSchema),
      execute: async ({ expenseId, expenseName }) => {
        const expenses = await getExpensesForUser(userId);
        const resolved = resolveReference(
          expenses,
          { id: expenseId, name: expenseName },
          "expense"
        );
        if (!resolved.ok) {
          return {
            ...failure(resolved),
            candidates: resolved.candidates?.map(expenseCandidate),
          };
        }

        const result = await deleteExpense(userId, resolved.value.id);
        return writeResult(result, {
          kind: "expense",
          id: resolved.value.id,
          label: resolved.value.name,
          detail: expenseDetail(resolved.value),
        });
      },
    }),

    record_expense_charge: tool({
      description:
        "Mark a scheduled expense charge as paid, recording the amount actually charged. Use the expense's scheduled charge date unless the user gives another.",
      inputSchema: z.object({
        ...expenseLookupSchema,
        amount: z
          .number()
          .finite()
          .positive()
          .describe("Amount actually charged, in US dollars."),
        chargeDate: dateKeySchema
          .optional()
          .describe("The charge date (YYYY-MM-DD); defaults to today."),
      }),
      execute: async ({ expenseId, expenseName, amount, chargeDate }) => {
        const expenses = await getExpensesForUser(userId);
        const resolved = resolveReference(
          expenses,
          { id: expenseId, name: expenseName },
          "expense"
        );
        if (!resolved.ok) {
          return {
            ...failure(resolved),
            candidates: resolved.candidates?.map(expenseCandidate),
          };
        }

        const date = chargeDate ?? asOfDate;
        const amountCents = Math.round(amount * 100);
        const result = await recordExpenseCharge(
          userId,
          resolved.value.id,
          date,
          amountCents
        );
        return writeResult(result, {
          kind: "charge",
          id: resolved.value.id,
          label: resolved.value.name,
          detail: `${money(amountCents)} on ${date}`,
        });
      },
    }),

    remove_expense_charge: tool({
      description:
        "Undo a paid charge on an expense for a given date, marking it unpaid.",
      inputSchema: z.object({
        ...expenseLookupSchema,
        chargeDate: dateKeySchema
          .optional()
          .describe("The charge date (YYYY-MM-DD); defaults to today."),
      }),
      execute: async ({ expenseId, expenseName, chargeDate }) => {
        const expenses = await getExpensesForUser(userId);
        const resolved = resolveReference(
          expenses,
          { id: expenseId, name: expenseName },
          "expense"
        );
        if (!resolved.ok) {
          return {
            ...failure(resolved),
            candidates: resolved.candidates?.map(expenseCandidate),
          };
        }

        const date = chargeDate ?? asOfDate;
        const result = await removeExpenseCharge(
          userId,
          resolved.value.id,
          date
        );
        return writeResult(result, {
          kind: "charge",
          id: resolved.value.id,
          label: resolved.value.name,
          detail: `Unpaid on ${date}`,
        });
      },
    }),

    log_account_balance: tool({
      description:
        "Record a payment account balance check-in. Balances are manual and may be negative for overdrafts.",
      inputSchema: z.object({
        ...accountLookupSchema,
        balance: z
          .number()
          .finite()
          .describe("Current account balance in US dollars; may be negative."),
        balanceDate: dateKeySchema
          .optional()
          .describe(
            "The date the balance is as of (YYYY-MM-DD); defaults to today."
          ),
      }),
      execute: async ({ accountId, accountName, balance, balanceDate }) => {
        const accounts = await getPaymentAccountsForUser(userId);
        const resolved = resolveReference(
          accounts,
          { id: accountId, name: accountName },
          "payment account"
        );
        if (!resolved.ok) {
          return {
            ...failure(resolved),
            candidates: resolved.candidates?.map(accountCandidate),
          };
        }

        const date = balanceDate ?? asOfDate;
        const balanceCents = Math.round(balance * 100);
        const result = await logAccountBalance(
          userId,
          resolved.value.id,
          date,
          balanceCents
        );
        return writeResult(result, {
          kind: "balance",
          id: resolved.value.id,
          label: resolved.value.name,
          detail: `${formatSignedMoney(balanceCents)} on ${date}`,
        });
      },
    }),

    create_payment_account: tool({
      description:
        "Add a payment account the user can assign expenses to and log balances against.",
      inputSchema: z.object({
        name: z
          .string()
          .trim()
          .min(1)
          .max(255)
          .describe("Account name, e.g. 'Checking' or 'Amex'."),
      }),
      execute: async ({ name }) => {
        const result = await createPaymentAccount(userId, name);
        return writeResult(result, { kind: "paymentAccount", label: name });
      },
    }),

    delete_payment_account: tool({
      description:
        "Remove a payment account. Linked expenses become unassigned; no expenses are deleted. Confirm with the user before calling.",
      inputSchema: z.object(accountLookupSchema),
      execute: async ({ accountId, accountName }) => {
        const accounts = await getPaymentAccountsForUser(userId);
        const resolved = resolveReference(
          accounts,
          { id: accountId, name: accountName },
          "payment account"
        );
        if (!resolved.ok) {
          return {
            ...failure(resolved),
            candidates: resolved.candidates?.map(accountCandidate),
          };
        }

        const result = await deletePaymentAccount(userId, resolved.value.id);
        return writeResult(result, {
          kind: "paymentAccount",
          label: resolved.value.name,
        });
      },
    }),

    update_income: tool({
      description:
        "Update the user's income and/or primary semi-monthly pay schedule. Only the fields you pass change; every other value is kept as-is. Use get_income_overview first when you need the current values.",
      inputSchema: incomeWriteSchema,
      execute: async (input) => {
        const current = await getIncomeOverviewForUser(userId);
        const fields = incomeWriteToFields(input, current);
        const result = await saveIncome(userId, fields);
        if (!result.ok) return failure(result);
        return {
          ok: true as const,
          message: result.message,
          entity: {
            kind: "income" as const,
            label: "Income",
            detail: `${money(fields.annualGrossIncome * 100)} · ${fields.taxDeductionPercentage}% tax${
              fields.scheduleEnabled ? " · semi-monthly pay schedule" : ""
            }`,
          },
        };
      },
    }),
  };
}
