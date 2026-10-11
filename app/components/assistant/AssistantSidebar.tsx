import { useState } from "react";
import { Link, NavLink, useFetcher } from "react-router";
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { AssistantConversationSummary } from "~/modules/services/AssistantConversationService";
import { MAX_CONVERSATION_TITLE_LENGTH } from "~/modules/assistant/conversation";

interface AssistantSidebarProps {
  conversations: AssistantConversationSummary[];
  activeConversationId: string | null;
  /** Controls the slide-over on small screens; always shown on `md`+. */
  mobileOpen: boolean;
  onClose: () => void;
}

/**
 * ChatGPT-style conversation list. Rendered by the assistant layout route so it
 * persists while switching between threads. Rename and delete post to the
 * layout action via fetchers, which revalidates the list.
 */
export function AssistantSidebar({
  conversations,
  activeConversationId,
  mobileOpen,
  onClose,
}: AssistantSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close conversations"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
      <aside
        aria-label="Conversations"
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/[0.07] bg-gray-950/95 backdrop-blur-md transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:bg-transparent",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center gap-2 px-3 py-3">
          <Link
            to="/assistant"
            onClick={onClose}
            className="inline-flex flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-gray-900/70 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-indigo-400/40 hover:bg-gray-800/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            New chat
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close conversations"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-gray-500">
              Your chats will appear here.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((conversation) => (
                <ConversationListItem
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeConversationId}
                  onNavigate={onClose}
                />
              ))}
            </ul>
          )}
        </nav>
      </aside>
    </>
  );
}

interface ConversationListItemProps {
  conversation: AssistantConversationSummary;
  active: boolean;
  onNavigate: () => void;
}

function ConversationListItem({
  conversation,
  active,
  onNavigate,
}: ConversationListItemProps) {
  const [editing, setEditing] = useState(false);
  const renameFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const deleting = deleteFetcher.state !== "idle";

  if (editing) {
    return (
      <li>
        <renameFetcher.Form
          method="post"
          action="/assistant"
          onSubmit={() => setEditing(false)}
          className="flex items-center gap-1 rounded-lg bg-gray-900/70 p-1"
        >
          <input type="hidden" name="intent" value="rename" />
          <input type="hidden" name="conversationId" value={conversation.id} />
          <input
            autoFocus
            name="title"
            defaultValue={conversation.title}
            maxLength={MAX_CONVERSATION_TITLE_LENGTH}
            aria-label="Conversation title"
            className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-sm text-gray-100 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-xs font-medium text-indigo-300 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Cancel
          </button>
        </renameFetcher.Form>
      </li>
    );
  }

  return (
    <li className="group relative">
      <NavLink
        to={`/assistant/${conversation.id}`}
        onClick={onNavigate}
        className={({ isActive }) =>
          [
            "block truncate rounded-lg py-2 pl-3 pr-16 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            isActive || active
              ? "bg-indigo-500/10 text-white shadow-[inset_2px_0_0_var(--color-indigo-400)]"
              : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-100",
          ].join(" ")
        }
      >
        {conversation.title}
      </NavLink>
      <div className="absolute inset-y-0 right-1 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Rename ${conversation.title}`}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        <deleteFetcher.Form
          method="post"
          action="/assistant"
          onSubmit={(event) => {
            const confirmed = window.confirm(
              `Delete "${conversation.title}"? This cannot be undone.`
            );
            if (!confirmed) event.preventDefault();
          }}
        >
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="conversationId" value={conversation.id} />
          <input
            type="hidden"
            name="isActive"
            value={active ? "true" : "false"}
          />
          <button
            type="submit"
            disabled={deleting}
            aria-label={`Delete ${conversation.title}`}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </deleteFetcher.Form>
      </div>
    </li>
  );
}
