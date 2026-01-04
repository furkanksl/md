import { create } from "zustand";
import Database from "@tauri-apps/plugin-sql";
import { v4 as uuidv4 } from "uuid";

export interface ScrapingItem {
  id: string;
  url: string;
  prompt: string;
  result: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
}

interface ScrapingState {
  history: ScrapingItem[];
  isLoading: boolean;
  loadHistory: () => Promise<void>;
  addScrapingTask: (url: string, prompt: string, result: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useScrapingStore = create<ScrapingState>((set) => ({
  history: [],
  isLoading: false,

  loadHistory: async () => {
    set({ isLoading: true });
    try {
      const db = await Database.load("sqlite:mydrawer.db");
      const result = await db.select<ScrapingItem[]>(
        "SELECT * FROM scraping_history ORDER BY created_at DESC"
      );
      set({ history: result });
    } catch (error) {
      console.error("Failed to load scraping history:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addScrapingTask: async (url: string, prompt: string, result: string) => {
    try {
      const db = await Database.load("sqlite:mydrawer.db");
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const newItem: ScrapingItem = {
        id,
        url,
        prompt,
        result,
        status: "completed",
        created_at: now,
        completed_at: now,
      };

      await db.execute(
        "INSERT INTO scraping_history (id, url, prompt, result, status, created_at, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, url, prompt, result, "completed", now, now]
      );

      set((state) => ({ history: [newItem, ...state.history] }));
    } catch (error) {
      console.error("Failed to save scraping task:", error);
    }
  },

  deleteTask: async (id: string) => {
    try {
      const db = await Database.load("sqlite:mydrawer.db");
      await db.execute("DELETE FROM scraping_history WHERE id = $1", [id]);
      set((state) => ({ history: state.history.filter((i) => i.id !== id) }));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  },

  clearHistory: async () => {
    try {
      const db = await Database.load("sqlite:mydrawer.db");
      await db.execute("DELETE FROM scraping_history");
      set({ history: [] });
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  },
}));
