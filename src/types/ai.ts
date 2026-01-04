import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([z.string(), z.array(z.any())]), // structured content array support
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

export const AIConfigurationSchema = z.object({
  provider: z.enum(["anthropic", "openai", "custom"]),
  apiKey: z.string(),
  model: z.string(),
  parameters: z.object({
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    topP: z.number().optional(),
  }).optional(),
  systemPrompt: z.string().optional(),
  customEndpoint: z.string().url().optional(),
});
export type AIConfiguration = z.infer<typeof AIConfigurationSchema>;
