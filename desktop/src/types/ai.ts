import { z } from "zod";

export interface Attachment {
  name?: string;
  type?: string;
  path?: string;
  base64?: string;
}

export const ContentPartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('image'), image: z.string() }),
]);

export const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([z.string(), z.array(ContentPartSchema)]), 
  attachments: z.array(z.custom<Attachment>()).default([]),
  timestamp: z.string().datetime(),
  metadata: z.object({
    model: z.string().optional(),
    tokenCount: z.number().optional(),
    cost: z.number().optional(),
  }).optional(),
  parentId: z.string().uuid().optional(),
  status: z.enum(["pending", "streaming", "completed", "error"]),
});
export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  messages: z.array(MessageSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: z.object({
    totalTokens: z.number().optional(),
    totalCost: z.number().optional(),
    modelPreferences: z.record(z.string(), z.string()).optional(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const CustomModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.literal("custom"),
  baseUrl: z.string(),
  apiKey: z.string().optional(),
  modelId: z.string(), // The actual model string sent to the API
});
export type CustomModel = z.infer<typeof CustomModelSchema>;

export const AIConfigurationSchema = z.object({
  provider: z.enum(["anthropic", "openai", "google", "mistral", "groq", "custom"]),
  apiKey: z.string(),
  model: z.string(),
  parameters: z.object({
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    topP: z.number().optional(),
  }).optional(),
  systemPrompt: z.string().optional(),
  enableWebSearch: z.boolean().optional(),
  customEndpoint: z.string().optional(), // Deprecated in favor of customModels but kept for compat
  customModels: z.array(CustomModelSchema).optional(),
});
export type AIConfiguration = z.infer<typeof AIConfigurationSchema>;
