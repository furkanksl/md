import { z } from "zod";

export const AttachmentSchema = z.object({
  path: z.string(),
  name: z.string(),
  type: z.string(), // mime type
  size: z.number(),
  base64: z.string().optional(), // For optimized transfer
});

export type Attachment = z.infer<typeof AttachmentSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
  attachments: z.array(AttachmentSchema).default([]),
  timestamp: z.string().or(z.date()),
  status: z.enum(["pending", "streaming", "completed", "error"]).optional(),
  metadata: z.object({
    model: z.string().optional(),
    tokenCount: z.number().optional(),
    cost: z.number().optional(),
  }).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  modelId: z.string(),
  providerId: z.string(),
  folderId: z.string().uuid().nullable().optional(),
  orderIndex: z.number().default(0),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const FolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  orderIndex: z.number().default(0),
  createdAt: z.string().or(z.date()),
});

export type Folder = z.infer<typeof FolderSchema>;
