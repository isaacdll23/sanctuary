import {
  BeakerIcon,
  BoltIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  REASONING_EFFORTS,
  type ReasoningEffort,
} from "~/modules/assistant/conversation";

interface EffortMeta {
  label: string;
  /** Plain-language trade-off shown under the control. */
  hint: string;
  Icon: typeof BoltIcon;
  /** Selected segment styling; each level gets its own accent hue. */
  active: string;
  /** Text/icon color while unselected (kept legible on the dark surface). */
  idle: string;
}

/**
 * Reasoning effort is a three-way trade-off between latency and depth, so it
 * reads better as a segmented control than a dropdown: every option stays
 * visible, the current level is obvious, and each level advertises its
 * trade-off in words. Low/medium/high are tinted emerald/cyan/violet so the
 * "how hard is it thinking" signal is pre-attentive.
 */
const EFFORT_META: Readonly<Record<ReasoningEffort, EffortMeta>> = {
  low: {
    label: "Low",
    hint: "Fastest replies, least deliberation",
    Icon: BoltIcon,
    active:
      "border-emerald-400/40 bg-emerald-500/15 text-emerald-900 shadow-sm shadow-black/20",
    idle: "text-emerald-700/90",
  },
  medium: {
    label: "Medium",
    hint: "Balanced speed and depth",
    Icon: SparklesIcon,
    active:
      "border-indigo-400/40 bg-indigo-500/15 text-indigo-200 shadow-sm shadow-black/20",
    idle: "text-indigo-300/80",
  },
  high: {
    label: "High",
    hint: "Most thorough, slower to answer",
    Icon: BeakerIcon,
    active:
      "border-violet-400/40 bg-violet-500/15 text-violet-200 shadow-sm shadow-black/20",
    idle: "text-violet-300/80",
  },
};

interface AssistantReasoningPickerProps {
  value: ReasoningEffort;
  onChange: (effort: ReasoningEffort) => void;
  disabled?: boolean;
}

/**
 * Lets the user trade speed for deliberation on the assistant's replies. The
 * choice is sent with each chat request, so changing it mid-thread applies to
 * subsequent messages only.
 *
 * Built on native radio inputs inside a `fieldset`/`legend` so arrow keys move
 * between levels and the group is announced correctly without extra JS.
 */
export function AssistantReasoningPicker({
  value,
  onChange,
  disabled = false,
}: AssistantReasoningPickerProps) {
  const selected = EFFORT_META[value];

  return (
    <fieldset
      disabled={disabled}
      className="flex flex-col items-end gap-1 disabled:opacity-60"
    >
      <legend className="sr-only">Reasoning effort</legend>
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="text-xs font-medium text-gray-400"
        >
          Reasoning
        </span>
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-white/[0.1] bg-gray-900/70 p-0.5">
          {REASONING_EFFORTS.map((effort) => {
            const { Icon, hint, active, idle, label } = EFFORT_META[effort];
            const isSelected = effort === value;
            return (
              <label
                key={effort}
                title={hint}
                className={[
                  "inline-flex cursor-pointer select-none items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs font-medium transition-colors",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500 has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-gray-950",
                  isSelected
                    ? active
                    : `hover:bg-white/[0.06] hover:text-gray-100 ${idle}`,
                  disabled ? "cursor-not-allowed" : "",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="assistant-reasoning-effort"
                  value={effort}
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => onChange(effort)}
                  className="sr-only"
                />
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </label>
            );
          })}
        </div>
      </div>
      <p
        aria-live="polite"
        className="sr-only text-[11px] leading-none text-gray-500 sm:not-sr-only"
      >
        {selected.hint}
      </p>
    </fieldset>
  );
}
