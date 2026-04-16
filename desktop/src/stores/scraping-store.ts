import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { dbClient } from "@/core/infra/database-client";

export interface ScrapingItem {
  id: string;
  url: string;
  prompt: string;
  result_preview: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
}

interface ScrapingState {
  history: ScrapingItem[];
  isLoading: boolean;
  loadHistory: (options?: { limit?: number; offset?: number; append?: boolean }) => Promise<{ items: ScrapingItem[]; hasMore: boolean }>;
  addScrapingTask: (url: string, prompt: string, result: string) => Promise<ScrapingItem | null>;
  loadResult: (id: string) => Promise<string>;
  deleteTask: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const DEFAULT_HISTORY_PAGE_SIZE = 100;

export const useScrapingStore = create<ScrapingState>((set) => ({
  history: [],
  isLoading: false,

  loadHistory: async (options) => {
    set({ isLoading: true });
    try {
      const db = await dbClient.getDb();
      const limit = options?.limit ?? DEFAULT_HISTORY_PAGE_SIZE;
      const offset = options?.offset ?? 0;
      const append = options?.append ?? false;
      const result = await db.select<ScrapingItem[]>(
        "SELECT id, url, prompt, status, created_at, completed_at, substr(result, 1, 2000) as result_preview FROM scraping_history ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit + 1, offset]
      );
      const hasMore = result.length > limit;
      const items = result.slice(0, limit);
      if (append) {
        set((state) => ({ history: [...state.history, ...items] }));
      } else {
        set({ history: items });
      }
      return { items, hasMore };
    } catch (error) {
      console.error("Failed to load scraping history:", error);
      return { items: [], hasMore: false };
    } finally {
      set({ isLoading: false });
    }
  },

  addScrapingTask: async (url: string, prompt: string, result: string) => {
    try {
      const db = await dbClient.getDb();
      const id = uuidv4();
      const now = new Date().toISOString();
      const resultPreview = result.slice(0, 2000);
      
      const newItem: ScrapingItem = {
        id,
        url,
        prompt,
        result_preview: resultPreview,
        status: "completed",
        created_at: now,
        completed_at: now,
      };

      await db.execute(
        "INSERT INTO scraping_history (id, url, prompt, result, status, created_at, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, url, prompt, result, "completed", now, now]
      );

      set((state) => ({ history: [newItem, ...state.history] }));
      return newItem;
    } catch (error) {
      console.error("Failed to save scraping task:", error);
      return null;
    }
  },

  loadResult: async (id: string) => {
    const db = await dbClient.getDb();
    const rows = await db.select<{ result: string }[]>(
      "SELECT result FROM scraping_history WHERE id = $1",
      [id]
    );
    if (rows.length === 0 || !rows[0]) {
      throw new Error("Result not found");
    }
    return rows[0].result;
  },

  deleteTask: async (id: string) => {
    try {
      const db = await dbClient.getDb();
      await db.execute("DELETE FROM scraping_history WHERE id = $1", [id]);
      set((state) => ({ history: state.history.filter((i) => i.id !== id) }));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  },

  clearHistory: async () => {
    try {
      const db = await dbClient.getDb();
      await db.execute("DELETE FROM scraping_history");
      set({ history: [] });
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  },
}));
