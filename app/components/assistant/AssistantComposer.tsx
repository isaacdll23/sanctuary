import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

/**
 * Composer shell for the Assistant. The controls are intentionally disabled:
 * this session only scaffolds the UI, and the submit action is added when the
 * chat backend is wired up.
 */
export function AssistantComposer() {
  return (
    <form
      className="mt-6"
      aria-label="Message composer"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-end gap-3 rounded-2xl border border-white/[0.07] bg-zinc-900/60 p-3 backdrop-blur-md">
        <label htmlFor="assistant-message" className="sr-only">
          Message
        </label>
        <textarea
          id="assistant-message"
          name="message"
          rows={1}
          disabled
          aria-describedby="assistant-composer-hint"
          placeholder="Chat is coming soon…"
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
          Send
        </button>
      </div>
      <p
        id="assistant-composer-hint"
        className="mt-2 px-2 text-xs text-gray-500"
      >
        Chat isn&apos;t connected yet — this preview only shows the interface.
      </p>
    </form>
  );
}
