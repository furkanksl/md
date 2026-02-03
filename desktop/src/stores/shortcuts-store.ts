import { create } from "zustand";
import { ShortcutRepository } from "@/core/infra/repositories";
import { AppShortcut } from "@/types/shortcuts";

interface ShortcutsState {
  apps: AppShortcut[];
  init: () => Promise<void>;
  addApp: (app: AppShortcut) => Promise<void>;
  removeApp: (id: string) => Promise<void>;
}

const shortcutRepo = new ShortcutRepository();

export const useShortcutsStore = create<ShortcutsState>((set, get) => ({
  apps: [],

  init: async () => {
    try {
      const apps = await shortcutRepo.getAll();
      set({ apps });
    } catch (e) {
      console.error("Failed to load shortcuts:", e);
    }
  },

  addApp: async (app) => {
    // Avoid duplicates
    if (get().apps.find((a) => a.path === app.path)) return;

    // Optimistic update
    set((state) => ({ apps: [...state.apps, app] }));

    try {
      await shortcutRepo.add(app);
    } catch (e) {
      console.error("Failed to add shortcut:", e);
      // Revert if failed? For now, we keep it simple.
    }
  },

  removeApp: async (id) => {
    // Optimistic update
    set((state) => ({ apps: state.apps.filter((a) => a.id !== id) }));

    try {
      await shortcutRepo.delete(id);
    } catch (e) {
      console.error("Failed to delete shortcut:", e);
    }
  },
}));
