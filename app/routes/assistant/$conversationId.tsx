import { redirect, useOutletContext } from "react-router";
import type { Route } from "./+types/$conversationId";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { getConversation } from "~/modules/services/AssistantConversationService";
import { AssistantChat } from "~/components/assistant/AssistantChat";
import type { AssistantOutletContext } from "./assistant";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Assistant" }];
}

export const loader = pageAccessLoader(
  "assistant",
  async (user, request, params) => {
    const conversationId = params.conversationId;
    if (!conversationId) throw redirect("/assistant");

    const conversation = await getConversation(user.id, conversationId);
    // Unknown or not-owned conversations are indistinguishable from the client.
    if (!conversation) throw redirect("/assistant");

    return { conversation };
  }
);

export default function AssistantConversationRoute({
  loaderData,
}: Route.ComponentProps) {
  const { aiConfigured, onOpenSidebar } =
    useOutletContext<AssistantOutletContext>();
  const { conversation } = loaderData;

  return (
    <AssistantChat
      // React Router reuses this component across param changes, so key it to
      // the conversation to reset the chat when switching threads.
      key={conversation.id}
      conversationId={conversation.id}
      initialMessages={conversation.messages}
      aiConfigured={aiConfigured}
      title={conversation.title}
      onOpenSidebar={onOpenSidebar}
    />
  );
}
