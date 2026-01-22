import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createGroq } from "@ai-sdk/groq";
import { customFetch } from "./custom-fetch";

export const getProvider = (providerId: string, apiKey: string) => {
  switch (providerId) {
    case "openai":
      return createOpenAI({ apiKey, fetch: customFetch });
    case "anthropic":
      return createAnthropic({ apiKey, fetch: customFetch });
    case "google":
      return createGoogleGenerativeAI({ apiKey, fetch: customFetch });
    case "mistral":
      return createMistral({ apiKey, fetch: customFetch });
    case "groq":
      return createGroq({ apiKey, fetch: customFetch });
    default:
      throw new Error(`Provider ${providerId} not supported`);
  }
};
