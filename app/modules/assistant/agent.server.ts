import {
  ToolLoopAgent,
  type LanguageModel,
  type ToolLoopAgentSettings,
} from "ai";
import { getReferenceDateKey } from "~/modules/finance/paySchedule";
import {
  DEFAULT_REASONING_EFFORT,
  type ReasoningEffort,
} from "./conversation";
import { createFinanceTools } from "./financeTools.server";

/** Provider options shape accepted by the agent, derived from the AI SDK. */
type AssistantProviderOptions = NonNullable<
  ToolLoopAgentSettings["providerOptions"]
>;

export interface AssistantAgentOptions {
  /** Authenticated user; tools read only this user's data. */
  userId: number;
  /** IANA time zone from the user's profile, used to anchor "now". */
  timeZone: string;
  /** Resolved language model, supplied by the caller. */
  model: LanguageModel;
  /** How much deliberation the model should spend on the reply. */
  reasoningEffort?: ReasoningEffort;
  now?: Date;
}

/**
 * Translates the user's effort choice into the OpenAI provider option the AI
 * SDK forwards to the API. Isolated so the mapping is testable without
 * constructing an agent.
 */
export function assistantProviderOptions(
  reasoningEffort: ReasoningEffort
): AssistantProviderOptions {
  return { openai: { reasoningEffort } };
}

export interface AssistantInstructionOptions {
  timeZone: string;
  now: Date;
  asOfDate: string;
}

/**
 * Builds the assistant's system instructions. The current time is injected on
 * every request so relative questions ("this month", "next payday") resolve
 * against the user's local clock rather than the model's training data.
 */
export function buildAssistantInstructions({
  timeZone,
  now,
  asOfDate,
}: AssistantInstructionOptions): string {
  // Explicit fields (rather than dateStyle/timeStyle) so the time-zone name can
  // be included; the two styles are mutually exclusive with `timeZoneName`.
  const formattedNow = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(now);

  return [
    "You are the Sanctuary assistant, an AI helper built into the Sanctuary personal management app.",
    "You help the signed-in user understand and reason about their own data.",
    "",
    `Current date and time: ${formattedNow}`,
    `User time zone: ${timeZone}`,
    `Today's date: ${asOfDate}`,
    "",
    "You can read the user's finance data with your tools:",
    "- get_income_overview: income, tax rate, and pay schedule.",
    "- list_expenses: itemized recurring expenses, with status, text, category, necessity, cost-type, and sort controls.",
    "- get_expense_summary: recurring-cost totals and breakdowns, plus what remains after income.",
    "- list_payment_accounts: payment accounts with their latest manual balance check-in.",
    "- get_balance_summary: total balance, how stale the check-ins are, and what is committed before the next payday.",
    "- get_upcoming_cash_flow: scheduled bills grouped by upcoming pay period, with paid status.",
    "",
    "You can change the user's finance data with your tools. Amounts you pass to write tools are in US dollars.",
    "- create_expense: add a recurring expense.",
    "- update_expense: change fields on an existing expense (identify it by expenseId or expenseName).",
    "- set_expense_active: pause or resume an expense so it is excluded from or included in totals.",
    "- delete_expense: permanently remove an expense and its recorded charges.",
    "- record_expense_charge: mark a scheduled charge as paid and record the amount.",
    "- remove_expense_charge: undo a paid charge.",
    "- log_account_balance: record a payment account balance check-in.",
    "- create_payment_account: add a payment account.",
    "- delete_payment_account: remove a payment account; linked expenses become unassigned.",
    "- update_income: update annual income, tax rate, and the primary semi-monthly pay schedule (only provided fields change).",
    "",
    "Guidelines:",
    "- Always call a tool before stating any of the user's financial figures. Never guess or invent amounts.",
    "- Tool amounts are in US dollars. Expenses are recurring bills; monthly and yearly figures normalize each bill's cadence and are not individual transactions.",
    "- Account balances are manual check-ins, not a bank sync. Mention how long ago a balance was checked when it may be stale.",
    "- Tools are scoped to the signed-in user; never imply access to anyone else's data.",
    "- Write tools apply immediately; there is no separate approval step. Only call one when the user has clearly asked for that change.",
    "- Before delete_expense or delete_payment_account, confirm with the user unless they already clearly asked to delete that specific item. Never delete based on a partial or fuzzy name match.",
    "- Identify records by id from an earlier read when you have one. If a name matches more than one record, ask the user which they mean instead of guessing.",
    "- After a successful write, briefly confirm what changed with the key values.",
    "- If income or expenses are not configured, say so and point the user to the Finance pages.",
    "- Be concise and use markdown. Format money like $1,234.56.",
    "- If a request is outside what your tools can do, say so plainly instead of pretending.",
  ].join("\n");
}

export function createAssistantAgent({
  userId,
  timeZone,
  model,
  reasoningEffort = DEFAULT_REASONING_EFFORT,
  now = new Date(),
}: AssistantAgentOptions) {
  const asOfDate = getReferenceDateKey(timeZone, now);

  return new ToolLoopAgent({
    id: "sanctuary-assistant",
    model,
    instructions: buildAssistantInstructions({ timeZone, now, asOfDate }),
    tools: createFinanceTools({ userId, asOfDate }),
    providerOptions: assistantProviderOptions(reasoningEffort),
  });
}
