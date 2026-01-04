import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AIConfiguration } from "@/types/ai";

interface SettingsState {
  aiConfigurations: Record<string, AIConfiguration>; // provider -> config
  activeProvider: string;
  clipboardHistoryLimit: number;
  clipboardRetentionDays: number;
  setAIConfiguration: (provider: string, config: AIConfiguration) => void;
  setActiveProvider: (provider: string) => void;
  setClipboardHistoryLimit: (limit: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiConfigurations: {},
      activeProvider: "openai",
      clipboardHistoryLimit: 1000,
      clipboardRetentionDays: 30,
      setAIConfiguration: (provider, config) =>
        set((state) => ({
          aiConfigurations: { ...state.aiConfigurations, [provider]: config },
        })),
      setActiveProvider: (provider) => set({ activeProvider: provider }),
      setClipboardHistoryLimit: (limit) => set({ clipboardHistoryLimit: limit }),
    }),
    {
      name: "settings-storage",
    }
  )
);
