import { z } from "zod";

export const AppShortcutSchema = z.object({
  id: z.string().uuid(),
  appName: z.string(),
  appPath: z.string(),
  bundleId: z.string(),
  icon: z.string().optional(), // base64 or path
  position: z.number(),
  hotkey: z.string().optional(),
  lastLaunched: z.string().datetime().optional(),
});
export type AppShortcut = z.infer<typeof AppShortcutSchema>;
