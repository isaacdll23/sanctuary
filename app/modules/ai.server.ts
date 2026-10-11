import { generateObject } from "ai";
import { z } from "zod";

/** AI-backed features. Each maps to an optional per-feature model override. */
export type AiFeature = "note-title" | "assistant";

const DEFAULT_MODEL = "gpt-6-luna";

const FEATURE_MODEL_ENV: Readonly<Record<AiFeature, string>> = {
  "note-title": "OPENAI_MODEL_NOTE_TITLE",
  assistant: "OPENAI_MODEL_ASSISTANT",
};

/**
 * Returns true when an OpenAI API key is configured. Read at call time so it
 * reflects the process environment and is easy to exercise in tests.
 */
export function isAiConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.OPENAI_API_KEY?.trim());
}

/**
 * Resolves the model for a feature: `OPENAI_MODEL_<FEATURE>` →
 * `OPENAI_MODEL` → the built-in default.
 */
export function resolveModel(
  feature: AiFeature,
  env: NodeJS.ProcessEnv = process.env
): string {
  return (
    env[FEATURE_MODEL_ENV[feature]]?.trim() ||
    env.OPENAI_MODEL?.trim() ||
    DEFAULT_MODEL
  );
}

/**
 * Builds a language model for a feature from the configured OpenAI-compatible
 * provider. Server-only: the provider import is dynamic and reads secrets.
 */
export async function getLanguageModel(feature: AiFeature) {
  // The Vercel AI SDK's OpenAI provider throws while loading when
  // OPENAI_BASE_URL is present but blank. Treat a blank value as unset so an
  // empty optional env var cannot crash the server at boot.
  if (process.env.OPENAI_BASE_URL?.trim() === "") {
    delete process.env.OPENAI_BASE_URL;
  }

  // Imported lazily so a malformed optional env var cannot break startup.
  const { createOpenAI } = await import("@ai-sdk/openai");
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  const provider = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY?.trim() || "",
    ...(baseURL ? { baseURL } : {}),
  });
  return provider(resolveModel(feature));
}

// Schema to validate AI response.
const noteTitleSchema = z.object({
  title: z.string().min(1).describe("A concise title for the note, 2-8 words."),
});

/**
 * Generates a concise title for a note based on its content.
 * @param content - The content of the note
 * @returns Promise<string> - A generated title (2-8 words)
 */
export async function generateNoteTitle(content: string): Promise<string> {
  if (!content.trim()) {
    throw new Error("Note content is empty");
  }

  if (!isAiConfigured()) {
    throw new Error("AI title generation is not configured");
  }

  try {
    const { object } = await generateObject({
      model: await getLanguageModel("note-title"),
      schema: noteTitleSchema,
      system:
        "You are a helpful assistant that generates concise titles for notes. Generate a title that is 2-8 words long, capturing the essence of the note.",
      prompt: `Generate a concise title (2-8 words) for the following note content:\n\n${content}`,
    });

    return object.title;
  } catch (error) {
    // Log provider details server-side, but return a user-safe message.
    console.error("Error generating note title:", error);
    throw new Error("Failed to generate title.");
  }
}
