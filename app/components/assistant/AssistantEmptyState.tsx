import {
  BanknotesIcon,
  ChartPieIcon,
  SparklesIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

/** Starter prompts. They deliberately include a write so the assistant's
 *  ability to change data is visible on first run, not just its reading. */
const EXAMPLE_REQUESTS = [
  {
    text: "How much do I spend each month?",
    Icon: ChartPieIcon,
    tint: "text-indigo-300 group-hover:border-indigo-400/40",
  },
  {
    text: "What's my biggest expense category?",
    Icon: TagIcon,
    tint: "text-emerald-300 group-hover:border-emerald-400/40",
  },
  {
    text: "Log my checking account balance",
    Icon: BanknotesIcon,
    tint: "text-violet-300 group-hover:border-violet-400/40",
  },
] as const;

interface AssistantEmptyStateProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function AssistantEmptyState({
  onSelect,
  disabled = false,
}: AssistantEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
        <SparklesIcon className="h-7 w-7 text-indigo-300" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-medium text-gray-100">
        Ask about your finances — or change them
      </h2>
      <p className="mt-2 max-w-md text-sm text-gray-400">
        I can read your income, expenses, and accounts, and add, update, or
        remove them for you. Every change comes back with a confirmation, so
        you always see what happened.
      </p>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
          Start here
        </p>
        <ul className="mt-3 flex max-w-xl flex-wrap justify-center gap-2">
          {EXAMPLE_REQUESTS.map(({ text, Icon, tint }) => (
            <li key={text}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(text)}
                className={`group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-gray-900/60 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-gray-800/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50 ${tint}`}
              >
                <Icon
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                {text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
