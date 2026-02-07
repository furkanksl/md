import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createGroq } from "@ai-sdk/groq";
import { customFetch } from "./custom-fetch";

interface ProviderConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  enableWebSearch?: boolean;
}

export const getProvider = (providerId: string, apiKey: string, config?: ProviderConfig) => {
  switch (providerId) {
    case "openai":
      return createOpenAI({ apiKey, fetch: customFetch });
    case "anthropic":
      return createAnthropic({
        apiKey,
        fetch: customFetch,
        headers: { "anthropic-dangerous-direct-browser-access": "true" },
      });
    case "google":
      const google = createGoogleGenerativeAI({ apiKey, fetch: customFetch });
      // @ts-ignore - useSearchGrounding is supported in latest SDK but types might lag
      return (modelId: string) => google(modelId, {
          useSearchGrounding: config?.enableWebSearch
      });
    case "mistral":
      return createMistral({ apiKey, fetch: customFetch });
    case "groq":
      return createGroq({ apiKey, fetch: customFetch });
    case "custom":
      if (!config?.baseUrl) {
        throw new Error("Base URL is required for custom provider");
      }
      
      let baseUrl = config.baseUrl;
      // Robust sanitization
      const removeTrailing = (str: string) => {
          while (str.endsWith('/')) str = str.slice(0, -1);
          return str;
      };
      
      baseUrl = removeTrailing(baseUrl);
      if (baseUrl.endsWith('/chat/completions')) {
          baseUrl = baseUrl.slice(0, -'/chat/completions'.length);
      }
      baseUrl = removeTrailing(baseUrl);

      // Custom providers (LM Studio, Ollama, etc.) usually follow OpenAI standard
      const customOpenAI = createOpenAI({
        apiKey: apiKey || "not-needed",
        baseURL: baseUrl,
        fetch: customFetch,
        headers: config.headers
      });
      return customOpenAI;
    default:
      throw new Error(`Provider ${providerId} not supported`);
  }
};