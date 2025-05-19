import { AzureOpenAI } from "openai";
import { z } from "zod";

const endpoint = process.env.OPENAI_ENDPOINT || "";
const modelName = "gpt-4.1-nano";
const deployment = "gpt-4.1-nano";

const apiKey = process.env.OPENAI_API_KEY || "";
const apiVersion = "2024-04-01-preview";
const options = { endpoint, apiKey, deployment, apiVersion };

const client = new AzureOpenAI(options);

// Schema to validate AI response
const titleResponseSchema = z.object({
  title: z.string(),
});

/**
 * Generates a concise title for a note based on its content
 * @param content - The content of the note
 * @returns Promise<string> - A generated title (2-8 words)
 */
export async function generateNoteTitle(content: string): Promise<string> {
  try {
    if (!content.trim()) {
      throw new Error("Note content is empty");
    }

    if (!client.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    console.log("Calling OpenAI to generate note title...");
    console.log("Content length:", content.length);

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-nano", // or use a different model as appropriate
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates concise titles for notes. Generate a title that is 2-8 words long, capturing the essence of the note. Respond with a JSON object that has a 'title' field containing your title.",
        },
        {
          role: "user",
          content: `Generate a concise title (2-8 words) for the following note content and return it as a JSON object with a 'title' field:\n\n${content}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;

    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse and validate the response
    const parsedResponse = JSON.parse(responseContent);
    const validatedResponse = titleResponseSchema.parse(parsedResponse);

    console.log("Response from OpenAI:", validatedResponse);

    return validatedResponse.title;
  } catch (error) {
    console.error("Error generating note title:", error);
    throw new Error(
      "Failed to generate title: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
}
