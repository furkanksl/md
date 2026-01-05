export interface ModelMetadata {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "mistral" | "groq";
  capabilities: {
    image: boolean;
    audio: boolean;
    tools: boolean;
  };
}

export const MODELS: ModelMetadata[] = [
  // OpenAI (2026 Series)
  { id: "gpt-5.2", name: "GPT-5.2", provider: "openai", capabilities: { image: true, audio: true, tools: true } },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "openai", capabilities: { image: true, audio: true, tools: true } },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai", capabilities: { image: true, audio: false, tools: true } },
  
  // Anthropic (4.5 Series)
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5", provider: "anthropic", capabilities: { image: true, audio: false, tools: true } },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: "anthropic", capabilities: { image: true, audio: false, tools: true } },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "anthropic", capabilities: { image: false, audio: false, tools: true } },

  // Google (Gemini 3)
  { id: "gemini-3-pro", name: "Gemini 3 Pro", provider: "google", capabilities: { image: true, audio: true, tools: true } },
  { id: "gemini-3-flash", name: "Gemini 3 Flash", provider: "google", capabilities: { image: true, audio: true, tools: true } },

  // Groq (Official Production & Preview IDs)
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  // Note: Groq currently has limited vision support in public docs, assuming these Llama 4 previews might support it or strict text-only
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout (Preview)", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick (Preview)", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  { id: "groq/compound", name: "Groq Compound", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  { id: "moonshotai/kimi-k2-instruct-0905", name: "Kimi K2 Instruct", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", provider: "groq", capabilities: { image: false, audio: false, tools: true } },

  // Mistral (Latest)
  { id: "mistral-large-latest", name: "Mistral Large 3", provider: "mistral", capabilities: { image: true, audio: false, tools: true } },
  { id: "mistral-small-latest", name: "Mistral Small 3", provider: "mistral", capabilities: { image: false, audio: false, tools: true } },
  { id: "codestral-latest", name: "Codestral 2", provider: "mistral", capabilities: { image: false, audio: false, tools: true } },
];

export const getModelById = (id: string) => MODELS.find(m => m.id === id) || MODELS[0];