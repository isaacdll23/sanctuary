import { tool } from "ai";
import { z } from "zod";
import {
  getExpensesForUser,
  getPaymentAccountsForUser,
  normalizeExpenseCategory,
} from "~/modules/services/ExpenseService";
import { getIncomeOverviewForUser } from "~/modules/services/IncomeService";
import {
  buildExpenseSummary,
  buildIncomeOverview,
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

/**
 * Read-only finance tools for the assistant. They never mutate data and always
 * scope reads to the authenticated user supplied in the context.
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
        "List the user's recurring expenses (bills and subscriptions) with per-item detail: amount, recurrence, monthly/yearly equivalent, category, necessity, cost type, payment method, account, and next charge date. Use this for itemized or filtered questions.",
      inputSchema: z.object({
        activeOnly: z
          .boolean()
          .optional()
          .describe(
            "When true (default), only active expenses are returned. Set false to include paused expenses."
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
      }),
      execute: async ({
        activeOnly = true,
        category,
        necessity,
        costType,
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

        const filtered = expenses.filter(
          (expense) =>
            (!activeOnly || expense.isActive !== 0) &&
            (wantedCategory == null || expense.category === wantedCategory) &&
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
  };
}
