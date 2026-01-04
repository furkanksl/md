import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

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
    <div className="h-full px-8 py-6 overflow-y-auto scrollbar-none">
      <h2 className="text-2xl font-light text-stone-800 mb-8">Intelligence</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {PROVIDERS.map((p) => {
            const isActive = activeProvider === p.id;
            return (
                <button
                    key={p.id}
                    onClick={() => setActiveProvider(p.id)}
                    className={clsx(
                        "h-16 rounded-3xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
                        isActive 
                            ? "bg-stone-800 text-white shadow-lg shadow-stone-300/50" 
                            : "bg-white text-stone-500 hover:bg-stone-50 border border-stone-100"
                    )}
                >
                    {isActive && (
                        <div className="absolute top-3 right-4">
                            <Check size={14} />
                        </div>
                    )}
                    {p.name}
                </button>
            );
        })}
      </div>

      <div className="bg-white rounded-[2rem] p-8 border border-stone-50 shadow-sm flex flex-col gap-6">
        <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-widest mb-4 ml-1">
                API Access Key
            </label>
            <input 
                type="password"
                className="w-full bg-stone-50 h-14 rounded-2xl px-6 text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-100 transition-all font-mono text-sm"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
            />
        </div>

        {activeProvider === 'custom' && (
            <div>
                <label className="block text-xs font-medium text-stone-400 uppercase tracking-widest mb-4 ml-1">
                    API Endpoint
                </label>
                <input 
                    className="w-full bg-stone-50 h-14 rounded-2xl px-6 text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-100 transition-all font-mono text-sm"
                    placeholder="https://api.openai.com/v1"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                />
            </div>
        )}

        <div className="flex justify-end mt-2">
            <button 
                onClick={handleSave}
                className="px-8 py-3 bg-stone-100 text-stone-600 rounded-full text-sm font-medium hover:bg-stone-200 transition-colors"
            >
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};
