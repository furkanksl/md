import { create } from "zustand";
import { AIConfiguration } from "@/types/ai";
import { SettingsRepository } from "@/core/infra/repositories";

const settingsRepo = new SettingsRepository();

interface SettingsState {
  // Data
  aiConfigurations: Record<string, AIConfiguration>; // provider -> config
  activeProvider: string;
  clipboardHistoryLimit: number;
  clipboardRetentionDays: number;
  hasCompletedOnboarding: boolean;
  autoHide: boolean;
  drawerPosition: 'left' | 'right' | 'hot-corners' | 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right';
  todoDeleteOnComplete: boolean;
  enabledModels: string[];

  // Actions
  init: () => Promise<void>;
  setAIConfiguration: (provider: string, config: AIConfiguration) => Promise<void>;
  setActiveProvider: (provider: string) => Promise<void>;
  setClipboardHistoryLimit: (limit: number) => Promise<void>;
  setHasCompletedOnboarding: (completed: boolean) => Promise<void>;
  setAutoHide: (autoHide: boolean) => Promise<void>;
  setDrawerPosition: (position: SettingsState['drawerPosition']) => Promise<void>;
  setTodoDeleteOnComplete: (enabled: boolean) => Promise<void>;
  toggleModel: (modelId: string) => Promise<void>;
  setEnabledModels: (models: string[]) => Promise<void>;
}

const DEFAULT_ENABLED_MODELS = [
    // OpenAI
    "gpt-5.2", "gpt-5-mini", "gpt-4o",
    // Anthropic
    "claude-opus-4-6", "claude-sonnet-4-5-20250929",
    // Google
    "gemini-3-pro-preview", "gemini-2.5-flash",
    // Mistral
    "mistral-large-latest", "mistral-small-latest",
    // Groq
    "llama-3.3-70b-versatile", "llama-3.1-8b-instant"
];

export const useSettingsStore = create<SettingsState>((set, get) => ({
  aiConfigurations: {},
  activeProvider: "openai",
  clipboardHistoryLimit: 50,
  clipboardRetentionDays: 30,
  hasCompletedOnboarding: false,
  autoHide: true,
  drawerPosition: 'left',
  todoDeleteOnComplete: false,
  enabledModels: DEFAULT_ENABLED_MODELS,

  init: async () => {
    try {
      const [
        aiConfigurations,
        activeProvider,
        clipboardHistoryLimit,
        clipboardRetentionDays,
        hasCompletedOnboarding,
        autoHide,
        drawerPosition,
        todoDeleteOnComplete,
        enabledModels
      ] = await Promise.all([
        settingsRepo.get<Record<string, AIConfiguration>>('ai_configurations'),
        settingsRepo.get<string>('active_provider'),
        settingsRepo.get<number>('clipboard_history_limit'),
        settingsRepo.get<number>('clipboard_retention_days'),
        settingsRepo.get<boolean>('has_completed_onboarding'),
        settingsRepo.get<boolean>('auto_hide'),
        settingsRepo.get<SettingsState['drawerPosition']>('drawer_position'),
        settingsRepo.get<boolean>('todo_delete_on_complete'),
        settingsRepo.get<string[]>('enabled_models'),
      ]);

      set({
        aiConfigurations: aiConfigurations || {},
        activeProvider: activeProvider || "openai",
        clipboardHistoryLimit: clipboardHistoryLimit ?? 50,
        clipboardRetentionDays: clipboardRetentionDays ?? 30,
        hasCompletedOnboarding: hasCompletedOnboarding ?? false,
        autoHide: autoHide ?? true,
        drawerPosition: drawerPosition || 'left',
        todoDeleteOnComplete: todoDeleteOnComplete ?? false,
        enabledModels: enabledModels || DEFAULT_ENABLED_MODELS,
      });
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  },

  setAIConfiguration: async (provider, config) => {
    const newConfigs = { ...get().aiConfigurations, [provider]: config };
    set({ aiConfigurations: newConfigs });
    await settingsRepo.set('ai_configurations', newConfigs);
  },

  setActiveProvider: async (provider) => {
    set({ activeProvider: provider });
    await settingsRepo.set('active_provider', provider);
  },

  setClipboardHistoryLimit: async (limit) => {
    set({ clipboardHistoryLimit: limit });
    await settingsRepo.set('clipboard_history_limit', limit);
  },

  setHasCompletedOnboarding: async (completed) => {
    set({ hasCompletedOnboarding: completed });
    await settingsRepo.set('has_completed_onboarding', completed);
  },

  setAutoHide: async (autoHide) => {
    set({ autoHide });
    await settingsRepo.set('auto_hide', autoHide);
  },

  setDrawerPosition: async (position) => {
    set({ drawerPosition: position });
    await settingsRepo.set('drawer_position', position);
  },

  setTodoDeleteOnComplete: async (enabled) => {
    set({ todoDeleteOnComplete: enabled });
    await settingsRepo.set('todo_delete_on_complete', enabled);
  },

  toggleModel: async (modelId) => {
      const { enabledModels } = get();
      const newModels = enabledModels.includes(modelId)
          ? enabledModels.filter(id => id !== modelId)
          : [...enabledModels, modelId];
      
      set({ enabledModels: newModels });
      await settingsRepo.set('enabled_models', newModels);
  },

  setEnabledModels: async (models) => {
      set({ enabledModels: models });
      await settingsRepo.set('enabled_models', models);
  }
}));