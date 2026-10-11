import { useOutletContext } from "react-router";
import type { Route } from "./+types/_index";
import { AssistantChat } from "~/components/assistant/AssistantChat";
import type { AssistantOutletContext } from "./assistant";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Assistant" }];
}

export default function AssistantNewChat() {
  const { aiConfigured, onOpenSidebar } =
    useOutletContext<AssistantOutletContext>();

  return (
    <AssistantChat
      conversationId={null}
      initialMessages={[]}
      aiConfigured={aiConfigured}
      title="New chat"
      onOpenSidebar={onOpenSidebar}
    />
  );
}
