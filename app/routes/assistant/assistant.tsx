import { PaperAirplaneIcon, SparklesIcon } from "@heroicons/react/24/outline";
import type { Route } from "./+types/assistant";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Assistant" }];
}

export const loader = pageAccessLoader("assistant", async () => null);

export default function Assistant() {
  return (
    <div className="flex h-full flex-col bg-transparent text-gray-100">
      <header className="border-b border-gray-800 px-4 py-4 md:px-8">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <div className="inline-flex rounded-xl border border-white/[0.08] bg-zinc-900/70 p-2">
            <SparklesIcon className="h-5 w-5 text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-50">Assistant</h1>
            <p className="text-sm text-gray-400">
              Chat with an AI agent that can read your Sanctuary data.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 md:px-8">
        {/* Conversation area — messages will render here. */}
        <div
          className="flex flex-1 flex-col items-center justify-center text-center"
          role="region"
          aria-label="Conversation"
        >
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-gray-800 bg-zinc-900/70">
            <SparklesIcon className="h-7 w-7 text-gray-500" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-medium text-gray-100">
            Your assistant is almost ready
          </h2>
          <p className="mt-2 max-w-md text-sm text-gray-400">
            This is a preview of the chat space. Conversation and data tools are
            not wired up yet.
          </p>
        </div>

        {/* Composer shell — disabled until the chat is implemented. */}
        <div
          className="mt-6 flex items-end gap-3 rounded-2xl border border-gray-800 bg-zinc-900/70 p-3"
          role="group"
          aria-label="Message composer"
        >
          <label htmlFor="assistant-message" className="sr-only">
            Message
          </label>
          <textarea
            id="assistant-message"
            rows={1}
            disabled
            placeholder="Chat is coming soon…"
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            type="button"
            disabled
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-500/20 px-4 text-sm font-medium text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
