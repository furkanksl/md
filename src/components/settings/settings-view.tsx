import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { useUIStore } from '@/stores/ui-store';
import { clsx } from 'clsx';
import { Check, Sun, Moon, Monitor } from 'lucide-react';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'google', name: 'Google' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'groq', name: 'Groq' },
  { id: 'custom', name: 'Custom' },
];

export const SettingsView = () => {
  const { activeProvider, setActiveProvider, setAIConfiguration, aiConfigurations } = useSettingsStore();
  const { theme, setTheme } = useUIStore();
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');

  useEffect(() => {
    const config = aiConfigurations[activeProvider];
    setApiKey(config?.apiKey || '');
    setEndpoint(config?.customEndpoint || '');
  }, [activeProvider, aiConfigurations]);

  const handleSave = () => {
    setAIConfiguration(activeProvider, {
        provider: activeProvider as any,
        apiKey,
        model: 'auto',
        customEndpoint: activeProvider === 'custom' ? endpoint : undefined
    });
  };

  return (
    <div className="h-full px-4 py-3 overflow-y-auto scrollbar-none space-y-6">
      
      {/* Theme Section */}
      <div>
        <h2 className="text-xl font-light text-stone-800 dark:text-stone-200 mb-4">Appearance</h2>
        <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] p-1.5 border border-stone-100 dark:border-stone-800 shadow-sm flex">
            {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor },
            ].map((t) => {
                const isActive = theme === t.id;
                const Icon = t.icon;
                return (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id as any)}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium transition-all duration-300",
                            isActive 
                                ? "bg-stone-800 text-white shadow-md dark:bg-stone-100 dark:text-stone-900" 
                                : "text-stone-500 hover:text-stone-700 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-800"
                        )}
                    >
                        <Icon size={14} />
                        {t.label}
                    </button>
                );
            })}
        </div>
      </div>

      {/* Intelligence Section */}
      <div>
      <h2 className="text-xl font-light text-stone-800 dark:text-stone-200 mb-4">Intelligence</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {PROVIDERS.map((p) => {
            const isActive = activeProvider === p.id;
            return (
                <button
                    key={p.id}
                    onClick={() => setActiveProvider(p.id)}
                    className={clsx(
                        "h-12 rounded-2xl text-xs font-medium transition-all duration-300 relative overflow-hidden border",
                        isActive 
                            ? "bg-stone-800 text-white shadow-lg shadow-stone-300/50 border-transparent dark:bg-stone-100 dark:text-stone-900" 
                            : "bg-white text-stone-500 hover:bg-stone-50 border-stone-100 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-800 dark:hover:bg-stone-800"
                    )}
                >
                    {isActive && (
                        <div className="absolute top-2 right-3">
                            <Check size={12} />
                        </div>
                    )}
                    {p.name}
                </button>
            );
        })}
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] p-6 border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col gap-4">
        <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">
                API Access Key
            </label>
            <input 
                type="password"
                className="w-full bg-stone-50 dark:bg-stone-800 h-10 rounded-xl px-4 text-stone-600 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 transition-all font-mono text-xs"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
            />
        </div>

        {activeProvider === 'custom' && (
            <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">
                    API Endpoint
                </label>
                <input 
                    className="w-full bg-stone-50 dark:bg-stone-800 h-10 rounded-xl px-4 text-stone-600 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 transition-all font-mono text-xs"
                    placeholder="https://api.openai.com/v1"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                />
            </div>
        )}

        <div className="flex justify-end mt-1">
            <button 
                onClick={handleSave}
                className="px-6 py-2 bg-stone-100 text-stone-600 rounded-xl text-xs font-medium hover:bg-stone-200 transition-colors dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
            >
                Save Changes
            </button>
        </div>
      </div>
      </div>
    </div>
  );
};
