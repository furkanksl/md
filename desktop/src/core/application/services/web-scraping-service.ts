import { invoke } from "@tauri-apps/api/core";
import { getProvider } from "@/core/infra/ai/provider-factory";
import { streamText } from "ai";
import { MODELS } from "@/core/domain/models";

export interface ScrapingResult {
  url: string;
  content: string;
  analysis: string;
}

export class WebScrapingService {
  /**
   * Fetches content from a URL and analyzes it using the specified AI model.
   */
  async scrapeAndAnalyze(
    url: string,
    prompt: string,
    modelId: string,
    providerId: string,
    apiKey: string,
    onToken: (token: string) => void
  ): Promise<string> {
    try {
      // 1. Fetch content (using Rust backend)
      const content = await this.scrapeUrl(url);

      // 2. Select Model
      const modelConfig = MODELS.find((m) => m.id === modelId);
      if (!modelConfig) {
        throw new Error(`Model ${modelId} not found`);
      }

      // 3. Initialize Provider
      const provider = getProvider(providerId, apiKey);
      
      // 4. Construct System Prompt for Context
      const systemPrompt = `You are a helpful research assistant. 
You have been provided with the text content of a webpage located at: ${url}

--- START OF WEBPAGE CONTENT ---
${content.substring(0, 100000)} 
--- END OF WEBPAGE CONTENT ---

Answer the user's request based PRIMARILY on the content provided above. 
If the answer is not in the content, state that clearly.
`;

      // 5. Stream Response
      const result = await streamText({
        model: provider(modelId),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
      });

      let fullResponse = "";
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        onToken(chunk);
      }

      return fullResponse;

    } catch (error) {
      console.error("Scraping Service Error:", error);
      throw error;
    }
  }

  private async scrapeUrl(url: string): Promise<string> {
    // Basic validation
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL provided");
    }

    // Call Rust backend
    const content = await invoke<string>("fetch_webpage", { url });
    
    if (!content || content.length < 50) {
        throw new Error("Failed to retrieve meaningful content from the URL.");
    }

    return content;
  }
}

export const webScrapingService = new WebScrapingService();
