/**
 * Whether a reasoning UI part has summary text worth showing.
 *
 * Reasoning-capable providers can emit a reasoning part that carries only
 * opaque, encrypted state (no summary). Rendering those would produce an empty
 * "Thought process" block, so callers should skip parts without visible text.
 */
export function hasReasoningText(text: string | null | undefined): boolean {
  return typeof text === "string" && text.trim().length > 0;
}
