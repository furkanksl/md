import { z } from "zod";

export const ClipboardEntrySchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  sourceApp: z.string().optional(), // bundle ID or name
  timestamp: z.string().datetime(),
  characterCount: z.number(),
  preview: z.string(), // truncated
  pinned: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});
export type ClipboardEntry = z.infer<typeof ClipboardEntrySchema>;
