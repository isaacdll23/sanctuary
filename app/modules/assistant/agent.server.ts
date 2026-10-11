import { ToolLoopAgent, type LanguageModel } from "ai";
import { getReferenceDateKey } from "~/modules/finance/paySchedule";
import { createFinanceTools } from "./financeTools.server";

export interface AssistantAgentOptions {
  /** Authenticated user; tools read only this user's data. */
  userId: number;
  /** IANA time zone from the user's profile, used to anchor "now". */
  timeZone: string;
  /** Resolved language model, supplied by the caller. */
  model: LanguageModel;
  now?: Date;
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
    "- list_expenses: itemized recurring expenses, with optional filters.",
    "- get_expense_summary: recurring-cost totals and breakdowns, plus what remains after income.",
    "",
    "Guidelines:",
    "- Always call a tool before stating any of the user's financial figures. Never guess or invent amounts.",
    "- Tool amounts are in US dollars. Expenses are recurring bills; monthly and yearly figures normalize each bill's cadence and are not individual transactions.",
    "- Tools are scoped to the signed-in user; never imply access to anyone else's data.",
    "- If income or expenses are not configured, say so and point the user to the Finance pages.",
    "- Be concise and use markdown. Format money like $1,234.56.",
    "- If a request is outside what your tools can do, say so plainly instead of pretending.",
  ].join("\n");
}

export function createAssistantAgent({
  userId,
  timeZone,
  model,
  now = new Date(),
}: AssistantAgentOptions) {
  const asOfDate = getReferenceDateKey(timeZone, now);

  return new ToolLoopAgent({
    id: "sanctuary-assistant",
    model,
    instructions: buildAssistantInstructions({ timeZone, now, asOfDate }),
    tools: createFinanceTools({ userId, asOfDate }),
  });
}
