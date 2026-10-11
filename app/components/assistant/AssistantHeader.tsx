import { Bars3Icon, SparklesIcon } from "@heroicons/react/24/outline";

interface AssistantHeaderProps {
  /** Conversation title, or "New chat" before the first message is sent. */
  title: string;
  /** Opens the conversation sidebar on small screens. */
  onOpenSidebar?: () => void;
}

/**
 * Presentational header for the chat pane. The title reflects the active
 * conversation so a long thread is identifiable at a glance.
 */
export function AssistantHeader({ title, onOpenSidebar }: AssistantHeaderProps) {
  return (
    <header className="border-b border-white/[0.07] bg-gray-950/40 px-4 py-4 backdrop-blur-sm md:px-8">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open conversations"
            className="-ml-1 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden"
          >
            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <div className="inline-flex rounded-xl border border-white/[0.08] bg-gradient-to-br from-indigo-500/20 to-violet-500/20 p-2">
          <SparklesIcon className="h-5 w-5 text-indigo-300" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-gray-50">
              {title}
            </h1>
            <span className="shrink-0 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-200">
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
