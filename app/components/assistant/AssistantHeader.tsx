import { SparklesIcon } from "@heroicons/react/24/outline";

/**
 * Presentational header for the Assistant route. Kept separate from the route
 * module so the page can stay focused on chat state once it is wired up.
 */
export function AssistantHeader() {
  return (
    <header className="border-b border-white/[0.07] px-4 py-4 md:px-8">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
        <div className="inline-flex rounded-xl border border-white/[0.08] bg-zinc-900/70 p-2 backdrop-blur-md">
          <SparklesIcon className="h-5 w-5 text-indigo-400" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-50">Assistant</h1>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
              Preview
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Chat with an AI agent that can read your Sanctuary data.
          </p>
        </div>
      </div>
    </header>
  );
}
