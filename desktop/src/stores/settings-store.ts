import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AIConfiguration } from "@/types/ai";

interface SettingsState {
  aiConfigurations: Record<string, AIConfiguration>; // provider -> config
  activeProvider: string;
  clipboardHistoryLimit: number;
  clipboardRetentionDays: number;
  hasCompletedOnboarding: boolean;
  autoHide: boolean;
  drawerPosition: 'left' | 'right' | 'hot-corners' | 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right';
  setAIConfiguration: (provider: string, config: AIConfiguration) => void;
  setActiveProvider: (provider: string) => void;
  setClipboardHistoryLimit: (limit: number) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setAutoHide: (autoHide: boolean) => void;
  setDrawerPosition: (position: 'left' | 'right' | 'hot-corners' | 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiConfigurations: {},
      activeProvider: "openai",
      clipboardHistoryLimit: 50, // Default to 50
      clipboardRetentionDays: 30,
      hasCompletedOnboarding: false,
      autoHide: true, // Default enabled
      drawerPosition: 'left',
      setAIConfiguration: (provider, config) =>
        set((state) => ({
          aiConfigurations: { ...state.aiConfigurations, [provider]: config },
        })),
      setActiveProvider: (provider) => set({ activeProvider: provider }),
      setClipboardHistoryLimit: (limit) => set({ clipboardHistoryLimit: limit }),
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      setAutoHide: (autoHide) => set({ autoHide }),
      setDrawerPosition: (position) => set({ drawerPosition: position }),
    }),
    {
      name: "settings-storage",
    }
  )
);
