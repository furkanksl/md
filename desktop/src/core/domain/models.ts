export interface ModelMetadata {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "mistral" | "groq" | "custom";
  capabilities: {
    image: boolean;
    audio: boolean;
    tools: boolean;
  };
  // For custom models
  config?: {
    baseUrl: string;
    apiKey?: string;
    modelId: string;
  };
}

export const MODELS: ModelMetadata[] = [
  // OpenAI (2026 Series)
  { id: "gpt-5.3", name: "GPT-5.3", provider: "openai", capabilities: { image: true, audio: true, tools: true } },
  // { id: "gpt-5.3-codex", name: "GPT-5.3 Codex", provider: "openai", capabilities: { image: true, audio: true, tools: true } },
  { id: "gpt-5.2", name: "GPT-5.2", provider: "openai", capabilities: { image: true, audio: true, tools: true } },
  // { id: "gpt-5.2-codex", name: "GPT-5.2 Codex", provider: "openai", capabilities: { image: true, audio: true, tools: true } },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "openai", capabilities: { image: true, audio: true, tools: true } },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", capabilities: { image: true, audio: true, tools: true } },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", capabilities: { image: true, audio: true, tools: true } },
  
  // Anthropic (4.x Series)
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "anthropic", capabilities: { image: true, audio: false, tools: true } },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: "anthropic", capabilities: { image: true, audio: false, tools: true } },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "anthropic", capabilities: { image: false, audio: false, tools: true } },
  { id: "claude-opus-4-1", name: "Claude Opus 4.1", provider: "anthropic", capabilities: { image: true, audio: false, tools: true } },

  // Google (Gemini 3 & 2.5)
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro", provider: "google", capabilities: { image: true, audio: true, tools: true } },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", provider: "google", capabilities: { image: true, audio: true, tools: true } },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google", capabilities: { image: true, audio: true, tools: true } },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google", capabilities: { image: true, audio: true, tools: true } },

  // Groq (Llama 3.x & Specialized)
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  { id: "qwen/qwen3-32b", name: "Qwen 3 32B", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  { id: "moonshotai/kimi-k2-instruct-0905", name: "Kimi K2 Instruct", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", provider: "groq", capabilities: { image: false, audio: false, tools: true } },
  { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", provider: "groq", capabilities: { image: false, audio: false, tools: true } },

  // Mistral (Latest Official)
  { id: "mistral-large-latest", name: "Mistral Large 3", provider: "mistral", capabilities: { image: true, audio: false, tools: true } },
  { id: "mistral-medium-latest", name: "Mistral Medium 3.1", provider: "mistral", capabilities: { image: true, audio: false, tools: true } },
  { id: "mistral-small-latest", name: "Mistral Small 3.2", provider: "mistral", capabilities: { image: false, audio: false, tools: true } },
  { id: "ministral-3-latest", name: "Ministral 3", provider: "mistral", capabilities: { image: true, audio: false, tools: true } },
  { id: "codestral-latest", name: "Codestral 25.01", provider: "mistral", capabilities: { image: false, audio: false, tools: true } },
  { id: "pixtral-large-latest", name: "Pixtral Large", provider: "mistral", capabilities: { image: true, audio: false, tools: true } },
];

export const getModelById = (id: string) => MODELS.find(m => m.id === id) || MODELS[0];