import {
  isReasoningEffort,
  REASONING_EFFORTS,
  type ReasoningEffort,
} from "~/modules/assistant/conversation";

const EFFORT_LABELS: Readonly<Record<ReasoningEffort, string>> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

interface AssistantReasoningSelectProps {
  value: ReasoningEffort;
  onChange: (effort: ReasoningEffort) => void;
  disabled?: boolean;
}

/**
 * Lets the user trade speed for deliberation on the assistant's replies. The
 * choice is sent with each chat request, so changing it mid-thread applies to
 * subsequent messages only.
 */
export function AssistantReasoningSelect({
  value,
  onChange,
  disabled = false,
}: AssistantReasoningSelectProps) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-gray-500">
      <span>Reasoning</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          if (isReasoningEffort(next)) onChange(next);
        }}
        className="rounded-lg border border-white/[0.1] bg-zinc-900/70 px-2 py-1 text-xs font-medium text-gray-200 transition-colors hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {REASONING_EFFORTS.map((effort) => (
          <option key={effort} value={effort}>
            {EFFORT_LABELS[effort]}
          </option>
        ))}
      </select>
    </label>
  );
}
