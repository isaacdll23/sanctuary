import { SparklesIcon } from "@heroicons/react/24/outline";

/**
 * Example requests shown before a conversation exists. They are static chips
 * for now and become interactive suggestions once chat is implemented.
 */
const EXAMPLE_REQUESTS = [
  "What did I spend this month?",
  "Summarize my recent notes",
  "What's on my plate today?",
] as const;

/**
 * Empty-conversation placeholder for the Assistant. It occupies the message
 * area and explains that the feature is not yet connected.
 */
export function AssistantEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-900/70">
        <SparklesIcon className="h-7 w-7 text-gray-500" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-medium text-gray-100">
        Your assistant is almost ready
      </h2>
      <p className="mt-2 max-w-md text-sm text-gray-400">
        This is a preview of the chat space. Conversation and data tools are not
        wired up yet.
      </p>

      <div className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          Ask things like
        </p>
        <ul className="mt-2 flex flex-wrap justify-center gap-2">
          {EXAMPLE_REQUESTS.map((request) => (
            <li
              key={request}
              className="rounded-full border border-white/[0.07] bg-zinc-900/60 px-3 py-1.5 text-xs text-gray-400"
            >
              {request}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
