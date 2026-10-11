// Assistant preferences stored in localStorage.
import {
  DEFAULT_REASONING_EFFORT,
  isReasoningEffort,
  type ReasoningEffort,
} from "~/modules/assistant/conversation";

const STORAGE_KEY = "sanctuary_assistant_reasoning_effort";

/**
 * Reads the user's preferred reasoning effort for the assistant. Returns the
 * default on the server or when nothing valid is stored, so a corrupt or
 * outdated value can never block the composer.
 */
export function loadReasoningEffort(): ReasoningEffort {
  if (typeof window === "undefined") return DEFAULT_REASONING_EFFORT;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isReasoningEffort(stored) ? stored : DEFAULT_REASONING_EFFORT;
  } catch (error) {
    console.error("Failed to load assistant reasoning effort:", error);
    return DEFAULT_REASONING_EFFORT;
  }
}

/** Persists the reasoning effort so it carries across chats and reloads. */
export function saveReasoningEffort(effort: ReasoningEffort): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, effort);
  } catch (error) {
    console.error("Failed to save assistant reasoning effort:", error);
  }
}
