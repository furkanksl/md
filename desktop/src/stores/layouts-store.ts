import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { dbClient } from '@/core/infra/database-client';

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowInfo {
  id: number;
  pid: number;
  app_name: string;
  title: string;
  frame: WindowRect;
}

export interface SavedLayout {
  id: string;
  name: string;
  description?: string;
  layout_data: WindowInfo[];
  created_at: string;
}

interface LayoutsState {
  layouts: SavedLayout[];
  isLoading: boolean;
  loadLayouts: () => Promise<void>;
  saveLayout: (name: string, windows: WindowInfo[]) => Promise<void>;
  deleteLayout: (id: string) => Promise<void>;
}

export const useLayoutsStore = create<LayoutsState>((set, get) => ({
  layouts: [],
  isLoading: false,

  loadLayouts: async () => {
    set({ isLoading: true });
    try {
      const db = await dbClient.getDb();
      const result = await db.select<any[]>('SELECT * FROM window_layouts ORDER BY created_at DESC');
      
      const layouts: SavedLayout[] = result.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        layout_data: JSON.parse(row.layout_data),
        created_at: row.created_at,
      }));

      set({ layouts });
    } catch (error) {
      console.error('Failed to load layouts:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveLayout: async (name: string, windows: WindowInfo[]) => {
    try {
      const db = await dbClient.getDb();
      const id = uuidv4();
      const now = new Date().toISOString();
      const layoutDataStr = JSON.stringify(windows);

      await db.execute(
        'INSERT INTO window_layouts (id, name, layout_data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
        [id, name, layoutDataStr, now, now]
      );

      // Reload
      get().loadLayouts();
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  },

  deleteLayout: async (id: string) => {
    try {
      const db = await dbClient.getDb();
      await db.execute('DELETE FROM window_layouts WHERE id = $1', [id]);
      
      set(state => ({
        layouts: state.layouts.filter(l => l.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete layout:', error);
    }
  }
}));
