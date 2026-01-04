import { z } from "zod";

export const ScrapingRequestSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  prompt: z.string(),
  status: z.enum(["pending", "fetching", "processing", "completed", "error"]),
  createdAt: z.string().datetime(),
});
export type ScrapingRequest = z.infer<typeof ScrapingRequestSchema>;

export const ScrapingResultSchema = z.object({
  requestId: z.string().uuid(),
  rawContent: z.string(),
  aiResponse: z.string().optional(),
  metadata: z.object({
    fetchTime: z.number(),
    contentLength: z.number(),
    statusCode: z.number(),
  }),
  completedAt: z.string().datetime(),
  error: z.string().optional(),
});
export type ScrapingResult = z.infer<typeof ScrapingResultSchema>;
