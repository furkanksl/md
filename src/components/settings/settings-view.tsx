import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '@/stores/settings-store';
import { useUIStore } from '@/stores/ui-store';
import { clsx } from 'clsx';
import { Check, Sun, Moon, Shield } from 'lucide-react';
import { toast } from 'sonner';

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
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkPermission();
    const interval = setInterval(checkPermission, 1000);
    
    // Add focus listener
    const handleFocus = () => {
        checkPermission();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkPermission = async () => {
    try {
        const granted = await invoke<boolean>("check_accessibility_permission");
        setHasPermission(granted);
    } catch (e) {
        console.error("Failed to check permission:", e);
    }
  };

  const requestPermission = async () => {
    setIsChecking(true);
    try {
        await invoke("request_accessibility_permission");
        setTimeout(checkPermission, 1000);
    } catch (e) {
        console.error("Failed to request permission:", e);
    } finally {
        setIsChecking(false);
    }
  };

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
    toast.success("Settings saved", {
      description: `${PROVIDERS.find(p => p.id === activeProvider)?.name} configuration updated successfully.`,
      duration: 2000,
      className: "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-stone-900 group-[.toaster]:text-stone-950 dark:group-[.toaster]:text-stone-50 group-[.toaster]:border-stone-200 dark:group-[.toaster]:border-stone-800 group-[.toaster]:shadow-lg",
      descriptionClassName: "group-[.toast]:text-stone-500 dark:group-[.toast]:text-stone-400",
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

      {/* Permissions Section */}
      <div>
        <h2 className="text-xl font-light text-stone-800 dark:text-stone-200 mb-4">Permissions</h2>
        <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] p-4 border border-stone-100 dark:border-stone-800 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        hasPermission ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" : "bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500"
                    )}>
                        <Shield size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-stone-800 dark:text-stone-200">Accessibility</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                            {hasPermission ? "Granted" : "Required for context"}
                        </span>
                    </div>
                </div>

                {hasPermission ? (
                    <div className="w-8 h-8 bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 rounded-full flex items-center justify-center">
                        <Check size={16} />
                    </div>
                ) : (
                    <button
                        onClick={requestPermission}
                        disabled={isChecking}
                        className="px-4 py-2 bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isChecking ? "Checking..." : "Request"}
                    </button>
                )}
            </div>
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
