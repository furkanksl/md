import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { Save, Key, Shield, HardDrive, Check } from 'lucide-react';
import { clsx } from 'clsx';

const PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' 
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Claude_AI_logo.svg' 
  },
  { 
    id: 'google', 
    name: 'Gemini', 
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg' 
  },
  { 
    id: 'xai', 
    name: 'Grok', 
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Grok_logo_%282023-2025%29.svg' 
  },
  { 
    id: 'meta', 
    name: 'Llama', 
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Meta_Platforms_Inc._logo_%28cropped%29.svg' 
  },
  { 
    id: 'mistral', 
    name: 'Mistral', 
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Mistral_AI_logo_%282025%E2%80%93%29.svg' 
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    iconUrl: 'https://static.cdnlogo.com/logos/d/9/deepseek-icon.svg' 
  },
  { 
    id: 'moonshot', 
    name: 'Kimi', 
    iconUrl: 'https://platform.moonshot.ai/lightmode.svg' 
  },
  { 
    id: 'custom', 
    name: 'Custom', 
    iconUrl: '' // Handled specially
  },
];

export const SettingsView = () => {
  const { 
    activeProvider, 
    setActiveProvider, 
    setAIConfiguration,
    aiConfigurations
  } = useSettingsStore();

  // Local state for the form before saving
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Sync apiKey state when activeProvider changes
  useEffect(() => {
    const config = aiConfigurations[activeProvider];
    setApiKey(config?.apiKey || '');
    setIsSaved(false);
  }, [activeProvider, aiConfigurations]);

  const handleSave = () => {
    // In a real app, validation and encryption would happen here
    setAIConfiguration(activeProvider, {
        provider: activeProvider as any,
        apiKey: apiKey,
        model: 'auto', // Default placeholder
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-purple-50/50 p-4 gap-4 overflow-y-auto">
      {/* AI Provider Section */}
      <div className="flex flex-col gap-3 p-4 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-1">
          <Key size={16} /> AI Provider Configuration
        </h3>
        
        <div className="grid grid-cols-3 gap-2">
            {PROVIDERS.map((p) => (
                <button
                    key={p.id}
                    onClick={() => setActiveProvider(p.id)}
                    className={clsx(
                        "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all min-h-[80px]",
                        activeProvider === p.id 
                            ? "bg-purple-100 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]" 
                            : "bg-white border-zinc-200 hover:border-zinc-400 text-zinc-500"
                    )}
                >
                    {p.id === 'custom' ? (
                        <div className="w-8 h-8 flex items-center justify-center mb-1">
                            <span className="text-xl">⚙️</span>
                        </div>
                    ) : (
                        <div className="w-8 h-8 flex items-center justify-center mb-1 overflow-hidden">
                            <img src={p.iconUrl} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                    )}
                    <span className="text-[10px] font-bold uppercase truncate w-full text-center">{p.name}</span>
                </button>
            ))}
        </div>

        <div className="flex flex-col gap-1 mt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">API Key</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border-2 border-zinc-200 rounded-lg focus-within:border-purple-500 transition-colors">
                <Key size={16} className="text-zinc-400" />
                <input 
                    type="password"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-300 font-mono"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                />
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
                Keys are stored locally on your device via macOS Keychain.
            </p>
        </div>

        <button 
            onClick={handleSave}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-500 text-white font-bold rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-purple-600 transition-all mt-1"
        >
            {isSaved ? <Check size={18} /> : <Save size={18} />}
            {isSaved ? 'SAVED!' : 'SAVE CONFIGURATION'}
        </button>
      </div>

      {/* General Preferences */}
      <div className="p-4 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
          <HardDrive size={16} /> Data & Storage
        </h3>
        
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm font-bold">Clipboard History</span>
                    <span className="text-[10px] text-zinc-500">Auto-clear after 30 days</span>
                </div>
                <div className="w-10 h-6 bg-green-500 rounded-full border-2 border-black relative cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white border-2 border-black rounded-full" />
                </div>
            </div>

            <div className="w-full h-px bg-zinc-100" />

            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm font-bold">Clear All Data</span>
                    <span className="text-[10px] text-red-400">Irreversible action</span>
                </div>
                <button className="px-3 py-1 bg-red-50 text-red-500 border-2 border-red-100 hover:border-red-500 rounded-lg text-xs font-bold transition-colors">
                    CLEAR
                </button>
            </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 text-center">
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200">
            <Shield size={12} className="text-zinc-400" />
            <span className="text-[10px] font-medium text-zinc-500">v0.1.0 • Privacy First</span>
        </div>
      </div>
    </div>
  );
};
