import type { Route } from "./+types/assistant";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { AssistantComposer } from "~/components/assistant/AssistantComposer";
import { AssistantEmptyState } from "~/components/assistant/AssistantEmptyState";
import { AssistantHeader } from "~/components/assistant/AssistantHeader";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Assistant" }];
}

export const loader = pageAccessLoader("assistant", async () => null);

export default function Assistant() {
  return (
    <div className="flex h-full flex-col bg-transparent text-gray-100">
      <AssistantHeader />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 md:px-8">
        {/* Conversation area — messages render here once chat is implemented. */}
        <section
          className="flex flex-1 flex-col"
          aria-label="Conversation"
        >
          <AssistantEmptyState />
        </section>

        <AssistantComposer />
      </div>
    </div>
  );
}
