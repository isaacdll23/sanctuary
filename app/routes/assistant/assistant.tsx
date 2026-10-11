import { useState } from "react";
import { Outlet, redirect, useMatch } from "react-router";
import type { Route } from "./+types/assistant";
import {
  pageAccessAction,
  pageAccessLoader,
} from "~/modules/middleware/pageAccess";
import { isAiConfigured } from "~/modules/ai.server";
import {
  deleteConversation,
  listConversations,
  renameConversation,
} from "~/modules/services/AssistantConversationService";
import { AssistantSidebar } from "~/components/assistant/AssistantSidebar";
import { MAX_CONVERSATION_TITLE_LENGTH } from "~/modules/assistant/conversation";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Assistant" }];
}

export const loader = pageAccessLoader("assistant", async (user) => ({
  aiConfigured: isAiConfigured(),
  conversations: await listConversations(user.id),
}));

/**
 * The sidebar orders by recent activity, which changes as messages are sent, so
 * refresh it whenever the assistant section navigates (e.g. adopting a new
 * chat's URL) rather than showing a stale list.
 */
export function shouldRevalidate() {
  return true;
}

export type AssistantActionData =
  | { ok: true }
  | { ok: false; error: string };

export const action = pageAccessAction(
  "assistant",
  async (user, request): Promise<AssistantActionData | Response> => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const conversationId = String(formData.get("conversationId") ?? "").trim();

    if (intent === "rename") {
      const title = String(formData.get("title") ?? "").trim();
      if (!conversationId || !title) {
        return { ok: false, error: "A title is required." };
      }
      const renamed = await renameConversation(
        user.id,
        conversationId,
        title.slice(0, MAX_CONVERSATION_TITLE_LENGTH)
      );
      if (!renamed) return { ok: false, error: "Conversation not found." };
      return { ok: true };
    }

    if (intent === "delete") {
      await deleteConversation(user.id, conversationId);
      // Deleting the open chat should not leave the user on a dead URL.
      if (formData.get("isActive") === "true") return redirect("/assistant");
      return { ok: true };
    }

    return { ok: false, error: "Unknown action." };
  }
);

export interface AssistantOutletContext {
  aiConfigured: boolean;
  onOpenSidebar: () => void;
}

export default function AssistantLayout({ loaderData }: Route.ComponentProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const match = useMatch("/assistant/:conversationId");

  return (
    <div className="flex h-full min-h-0 bg-transparent text-gray-100">
      <AssistantSidebar
        conversations={loaderData.conversations}
        activeConversationId={match?.params.conversationId ?? null}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet
          context={{
            aiConfigured: loaderData.aiConfigured,
            onOpenSidebar: () => setMobileSidebarOpen(true),
          } satisfies AssistantOutletContext}
        />
      </div>
    </div>
  );
}
