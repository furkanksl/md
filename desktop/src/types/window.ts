import { z } from "zod";

export const WindowStateSchema = z.object({
  appId: z.string(), // Bundle ID
  title: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  displayIndex: z.number(),
  isMinimized: z.boolean(),
  isMaximized: z.boolean(),
  focusOrder: z.number(),
});
export type WindowState = z.infer<typeof WindowStateSchema>;

export const WindowLayoutSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  windowStates: z.array(WindowStateSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  thumbnail: z.string().optional(), // base64
  hotkey: z.string().optional(),
});
export type WindowLayout = z.infer<typeof WindowLayoutSchema>;

export const WindowActionSchema = z.object({
  type: z.enum(["move", "resize", "minimize", "maximize", "close", "focus"]),
  target: z.string(), // appId or title pattern
  parameters: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    size: z.object({ width: z.number(), height: z.number() }).optional(),
    displayIndex: z.number().optional(),
  }).optional(),
  sequenceOrder: z.number().optional(),
});
export type WindowAction = z.infer<typeof WindowActionSchema>;
