import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { clsx } from 'clsx';
import { Check, CircleCheck, CircleX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getProvider } from '@/core/infra/ai/provider-factory';
import { generateText } from 'ai';
import { CustomModel } from '@/types/ai';
import { CustomModelManager } from './custom-model-manager';

const PROVIDERS = [
    { id: 'openai', name: 'OpenAI', testModel: 'gpt-5-mini-2025-08-07' },
    { id: 'anthropic', name: 'Anthropic', testModel: 'claude-haiku-4-5-20251001' },
    { id: 'google', name: 'Google', testModel: 'gemini-3-flash-preview' },
    { id: 'mistral', name: 'Mistral', testModel: 'mistral-small-latest' },
    { id: 'groq', name: 'Groq', testModel: 'llama-3.3-70b-versatile' },
    { id: 'custom', name: 'Custom', testModel: 'auto' },
];

export const IntelligenceSection = () => {
    const { activeProvider, setActiveProvider, setAIConfiguration, aiConfigurations } = useSettingsStore();
    const [apiKey, setApiKey] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [customModels, setCustomModels] = useState<CustomModel[]>([]);

    useEffect(() => {
        const config = aiConfigurations[activeProvider];
        setApiKey(config?.apiKey || '');
        setTestStatus('idle');
        
        if (activeProvider === 'custom') {
            setCustomModels(config?.customModels || []);
        }
    }, [activeProvider, aiConfigurations]);

    const handleSave = () => {
        setAIConfiguration(activeProvider, {
            provider: activeProvider as any,
            apiKey: activeProvider === 'custom' ? 'custom' : apiKey, // specific api keys are in customModels
            model: 'auto',
            customModels: activeProvider === 'custom' ? customModels : undefined
        });
        toast.success("Settings saved", {
            description: `${PROVIDERS.find(p => p.id === activeProvider)?.name} configuration updated successfully.`,
            duration: 2000,
            className: "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-stone-900 group-[.toaster]:text-stone-950 dark:group-[.toaster]:text-stone-50 group-[.toaster]:border-stone-200 dark:group-[.toaster]:border-stone-800 group-[.toaster]:shadow-lg",
            descriptionClassName: "group-[.toast]:text-stone-500 dark:group-[.toast]:text-stone-400",
        });
        setTestStatus('idle');
    };

    const handleTestConnection = async () => {
        // Standard provider test only
        if (activeProvider === 'custom') return;

        if (!apiKey) {
            toast.error("API Key missing", { description: "Please enter an API key to test." });
            return;
        }

        setTestStatus('testing');
        try {
            const providerConfig = PROVIDERS.find(p => p.id === activeProvider);
            const providerFactory = getProvider(activeProvider, apiKey);
            const modelToTest = providerConfig?.testModel || 'gpt-4o-mini';

            console.log(`[Settings] Testing connection to ${modelToTest}`);
            const result = await generateText({
                model: providerFactory(modelToTest) as any,
                messages: [{ role: 'user', content: 'Say "1"' }],
            });

            if (result.text) {
                setTestStatus('success');
                toast.success("Connection Successful", { description: "Provider is working." });
            } else {
                throw new Error("No response received.");
            }
        } catch (error: any) {
            console.error("Test failed:", error);
            setTestStatus('error');
            toast.error("Connection Failed", { description: error.message || "Could not connect to the provider." });
        }
    };

    return (
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
                {activeProvider !== 'custom' ? (
                    <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">
                            API Access Key
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                className={clsx(
                                    "w-full bg-stone-50 dark:bg-stone-800 h-10 rounded-xl px-4 pr-10 text-stone-600 dark:text-stone-300 focus:outline-none focus:ring-2 transition-all font-mono text-xs",
                                    testStatus === 'error' ? "focus:ring-red-200 dark:focus:ring-red-900/50" : "focus:ring-stone-100 dark:focus:ring-stone-700"
                                )}
                                placeholder="sk-..."
                                value={apiKey}
                                onChange={(e) => { setApiKey(e.target.value); setTestStatus('idle'); }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {testStatus === 'testing' && <Loader2 size={14} className="animate-spin text-stone-400" />}
                                {testStatus === 'success' && <CircleCheck size={14} className="text-green-500" />}
                                {testStatus === 'error' && <CircleX size={14} className="text-red-500" />}
                            </div>
                        </div>
                    </div>
                ) : (
                    <CustomModelManager 
                        customModels={customModels} 
                        onUpdate={setCustomModels} 
                    />
                )}

                <div className="flex justify-end gap-2 mt-1">
                    {activeProvider !== 'custom' && (
                        <button
                            onClick={handleTestConnection}
                            disabled={testStatus === 'testing' || !apiKey}
                            className="px-4 py-2 bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 rounded-xl text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                        >
                            {testStatus === 'testing' ? 'Testing...' : 'Test Key'}
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl text-xs font-medium hover:opacity-90 transition-opacity shadow-lg shadow-stone-200/50 dark:shadow-none"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};