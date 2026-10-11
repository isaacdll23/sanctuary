import { useEffect, useRef, useState } from "react";
import {
  PaperAirplaneIcon,
  StopIcon,
} from "@heroicons/react/24/outline";

interface AssistantComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isBusy: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

const MAX_TEXTAREA_HEIGHT = 160;

export function AssistantComposer({
  onSend,
  onStop,
  isBusy,
  disabled = false,
  disabledReason,
}: AssistantComposerProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = input.trim();
  const canSend = !disabled && !isBusy && trimmed.length > 0;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [input]);

  function submit() {
    if (!canSend) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <form
      className="mt-6"
      aria-label="Message composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex items-end gap-3 rounded-2xl border border-white/[0.07] bg-zinc-900/60 p-3 backdrop-blur-md">
        <label htmlFor="assistant-message" className="sr-only">
          Message
        </label>
        <textarea
          id="assistant-message"
          name="message"
          ref={textareaRef}
          rows={1}
          value={input}
          disabled={disabled}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
          aria-describedby="assistant-composer-hint"
          placeholder={
            disabled ? "Chat is unavailable…" : "Ask about your finances…"
          }
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed"
        />
        {isBusy ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.12] px-4 text-sm font-medium text-gray-200 transition-colors hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            <StopIcon className="h-4 w-4" aria-hidden="true" />
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
            Send
          </button>
        )}
      </div>
      <p id="assistant-composer-hint" className="mt-2 px-2 text-xs text-gray-500">
        {disabledReason ??
          "The assistant can read your finance data. Press Enter to send, Shift+Enter for a new line."}
      </p>
    </form>
  );
}
