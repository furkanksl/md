import { create } from "zustand";
import { clipboardService } from "@/core/application/clipboard-service";
import { listen } from "@tauri-apps/api/event";

interface ClipboardState {
  items: any[];
  isMonitoring: boolean;
  unlistenFn: (() => void) | null;
  isLoading: boolean;
  offset: number;
  hasMore: boolean;
  
  loadHistory: (options?: { limit?: number; offset?: number; append?: boolean }) => Promise<{ items: any[]; hasMore: boolean }>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  deleteItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  items: [],
  isMonitoring: false,
  unlistenFn: null,
  isLoading: false,
  offset: 0,
  hasMore: false,

  loadHistory: async (options) => {
    set({ isLoading: true });
    try {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const append = options?.append ?? false;
      const rows = await clipboardService.getHistory({ limit: limit + 1, offset });
      const hasMore = rows.length > limit;
      const items = rows.slice(0, limit);

      if (append) {
        set((state) => ({
          items: [...state.items, ...items],
          offset: offset + items.length,
          hasMore
        }));
      } else {
        set({ items, offset: items.length, hasMore });
      }
      return { items, hasMore };
    } catch (e) {
      console.error("Failed to load clipboard history:", e);
      return { items: [], hasMore: false };
    } finally {
      set({ isLoading: false });
    }
  },

  startMonitoring: async () => {
    if (get().isMonitoring) return;
    
    // Listen for backend events
    const unlisten = await listen("clipboard-changed", () => {
        console.log("Clipboard update received from backend");
        get().loadHistory({ limit: 50, offset: 0, append: false });
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
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      offset: Math.max(0, state.offset - 1)
    }));
    await clipboardService.deleteItem(id);
  },

  clearHistory: async () => {
    // Optimistic update
    set({ items: [], offset: 0, hasMore: false });
    await clipboardService.clearHistory();
  }
}));
