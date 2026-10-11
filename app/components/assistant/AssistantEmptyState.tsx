import { SparklesIcon } from "@heroicons/react/24/outline";

/** Starter questions that map onto the assistant's finance tools. */
const EXAMPLE_REQUESTS = [
  "How much do I spend each month?",
  "What's my biggest expense category?",
  "When is my next payday, and what's left after bills?",
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
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-900/70">
        <SparklesIcon className="h-7 w-7 text-indigo-400" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-medium text-gray-100">
        Ask about your finances
      </h2>
      <p className="mt-2 max-w-md text-sm text-gray-400">
        I can read your income and recurring expenses. Start with one of these,
        or type your own question below.
      </p>

      <div className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          Try asking
        </p>
        <ul className="mt-2 flex flex-wrap justify-center gap-2">
          {EXAMPLE_REQUESTS.map((request) => (
            <li key={request}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(request)}
                className="rounded-full border border-white/[0.07] bg-zinc-900/60 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-indigo-500/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {request}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
