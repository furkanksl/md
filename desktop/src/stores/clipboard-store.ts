import { create } from "zustand";
import { clipboardService } from "@/core/application/clipboard-service";
import { listen } from "@tauri-apps/api/event";

interface ClipboardState {
  items: any[];
  isMonitoring: boolean;
  unlistenFn: (() => void) | null;
  
  loadHistory: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  deleteItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  items: [],
  isMonitoring: false,
  unlistenFn: null,

  loadHistory: async () => {
    const items = await clipboardService.getHistory();
    set({ items });
  },

  startMonitoring: async () => {
    if (get().isMonitoring) return;
    
    // Listen for backend events
    const unlisten = await listen("clipboard-changed", () => {
        console.log("Clipboard update received from backend");
        get().loadHistory();
    });

    set({ isMonitoring: true, unlistenFn: unlisten });
  },

  stopMonitoring: () => {
    const { unlistenFn } = get();
    if (unlistenFn) unlistenFn();
    set({ isMonitoring: false, unlistenFn: null });
  },

  deleteItem: async (id) => {
    // Optimistic update
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    await clipboardService.deleteItem(id);
  },

  clearHistory: async () => {
    // Optimistic update
    set({ items: [] });
    await clipboardService.clearHistory();
  }
}));
