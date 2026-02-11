import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { clsx } from 'clsx';
import { Check, CheckCircle, XCircle, Loader2, Globe, Image as ImageIcon, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { getProvider } from '@/core/infra/ai/provider-factory';
import { generateText, LanguageModel } from 'ai';
import { CustomModel, AIConfiguration } from '@/types/ai';
import { CustomModelManager } from './custom-model-manager';
import { MODELS } from '@/core/domain/models';
import { motion, AnimatePresence } from 'framer-motion';

const PROVIDERS = [
    { id: 'openai', name: 'OpenAI', testModel: 'gpt-5-mini' },
    { id: 'anthropic', name: 'Anthropic', testModel: 'claude-haiku-4-5-20251001' },
    { id: 'google', name: 'Google', testModel: 'gemini-3-flash-preview' },
    { id: 'mistral', name: 'Mistral', testModel: 'mistral-small-latest' },
    { id: 'groq', name: 'Groq', testModel: 'llama-3.3-70b-versatile' },
    { id: 'custom', name: 'Custom', testModel: 'auto' },
];

export const IntelligenceSection = () => {
    const { activeProvider, setActiveProvider, setAIConfiguration, aiConfigurations, enabledModels: storeEnabledModels, setEnabledModels } = useSettingsStore();
    const [apiKey, setApiKey] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [customModels, setCustomModels] = useState<CustomModel[]>([]);
    const [localEnabledModels, setLocalEnabledModels] = useState<string[]>([]);
    const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

    // Sync from store on provider change or store update
    useEffect(() => {
        const config = aiConfigurations[activeProvider];
        setApiKey(config?.apiKey || '');
        setTestStatus('idle');
        setSaveState('idle');

        if (activeProvider === 'custom') {
            setCustomModels(config?.customModels || []);
        }
        // Initialize local enabled models from store
        setLocalEnabledModels(storeEnabledModels);
    }, [activeProvider, aiConfigurations, storeEnabledModels]);

    // Check for changes
    const hasChanges = (() => {
        const config = aiConfigurations[activeProvider];
        const storeApiKey = config?.apiKey || '';
        const storeCustomModels = config?.customModels || [];

        const isApiKeyChanged = apiKey !== storeApiKey;
        // Simple deep compare for custom models
        const isCustomModelsChanged = activeProvider === 'custom' && JSON.stringify(customModels) !== JSON.stringify(storeCustomModels);

        // Compare enabled models sets (order doesn't matter strictly but usually consistent, sorting ensures accuracy)
        const sortedLocal = [...localEnabledModels].sort();
        const sortedStore = [...storeEnabledModels].sort();
        const isEnabledModelsChanged = JSON.stringify(sortedLocal) !== JSON.stringify(sortedStore);

        return isApiKeyChanged || isCustomModelsChanged || isEnabledModelsChanged;
    })();

    const handleSave = async () => {
        await setAIConfiguration(activeProvider, {
            provider: activeProvider as AIConfiguration['provider'],
            apiKey: activeProvider === 'custom' ? 'custom' : apiKey,
            model: 'auto',
            // enableWebSearch is no longer managed here; derived from model capability
            customModels: activeProvider === 'custom' ? customModels : undefined
        });

        await setEnabledModels(localEnabledModels);

        toast.success("Settings saved", {
            description: `${PROVIDERS.find(p => p.id === activeProvider)?.name} configuration updated successfully.`,
            duration: 2000,
        });
        setSaveState('saved');

        // Reset save state after delay
        setTimeout(() => setSaveState('idle'), 2000);
    };

    const toggleLocalModel = (modelId: string) => {
        setLocalEnabledModels(prev =>
            prev.includes(modelId)
                ? prev.filter(id => id !== modelId)
                : [...prev, modelId]
        );
        setSaveState('idle');
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
                model: providerFactory(modelToTest) as LanguageModel,
                messages: [{ role: 'user', content: 'Say "1"' }],
            });

            if (result.text) {
                setTestStatus('success');
                toast.success("Connection Successful", { description: "Provider is working." });
                setTimeout(() => setTestStatus('idle'), 2000);
            } else {
                throw new Error("No response received.");
            }
        } catch (error: unknown) {
            console.error("Test failed:", error);
            setTestStatus('error');
            const errorMessage = error instanceof Error ? error.message : "Could not connect to the provider.";
            toast.error("Connection Failed", { description: errorMessage });
            setTimeout(() => setTestStatus('idle'), 2000);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-light text-foreground mb-4">Intelligence</h2>

            <div className="grid grid-cols-2 gap-3 mb-6">
                {PROVIDERS.map((p) => {
                    const isActive = activeProvider === p.id;
                    return (
                        <button
                            key={p.id}
                            onClick={() => setActiveProvider(p.id)}
                            className={clsx(
                                "h-12 rounded-lg text-xs font-medium transition-all duration-300 relative overflow-hidden border",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-transparent"
                                    : "bg-card text-muted-foreground hover:bg-muted border-border"
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

            <div className="bg-card rounded-[1.5rem] p-6 border border-border shadow-sm flex flex-col gap-4">
                {activeProvider !== 'custom' ? (
                    <>
                        <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
                                API Access Key
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    className={clsx(
                                        "w-full bg-input h-10 rounded-lg px-4 pr-10 text-foreground focus:outline-none focus:ring-2 transition-all font-mono text-xs",
                                        testStatus === 'error' ? "focus:ring-red-200 dark:focus:ring-red-900/50" : "focus:ring-ring"
                                    )}
                                    placeholder="sk-..."
                                    value={apiKey}
                                    onChange={(e) => { setApiKey(e.target.value); setSaveState('idle'); }}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {testStatus === 'testing' && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                                    {testStatus === 'success' && <CheckCircle size={14} className="text-green-500" />}
                                    {testStatus === 'error' && <XCircle size={14} className="text-red-500" />}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border">
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                                Enabled Models
                            </label>
                            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto scrollbar-none">
                                {MODELS.filter(m => m.provider === activeProvider).map(model => (
                                    <label key={model.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                                        <div className={clsx(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            localEnabledModels.includes(model.id)
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-input bg-transparent"
                                        )}>
                                            {localEnabledModels.includes(model.id) && <Check size={10} strokeWidth={3} />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={localEnabledModels.includes(model.id)}
                                            onChange={() => toggleLocalModel(model.id)}
                                        />
                                        <div className="flex flex-col">
                                            <div className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                                                {model.name}
                                                {model.capabilities.webSearch && (
                                                    <span className="p-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-[4px] flex items-center justify-center" title="Web Search">
                                                        <Globe size={10} />
                                                    </span>
                                                )}
                                                {model.capabilities.image && (
                                                    <div className="p-1 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-[4px] flex items-center justify-center" title="Image Support">
                                                        <ImageIcon size={10} />
                                                    </div>
                                                )}
                                                {model.capabilities.tools && (
                                                    <span className="p-1 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-[4px] flex items-center justify-center" title="Tool Support">
                                                        <Wrench size={10} />
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-mono">{model.id}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <CustomModelManager
                        customModels={customModels}
                        onUpdate={(models) => { setCustomModels(models); setSaveState('idle'); }}
                    />
                )}

                <div className="flex justify-end gap-2 mt-1">
                    {activeProvider !== 'custom' && (
                        <button
                            onClick={handleTestConnection}
                            disabled={testStatus === 'testing' || !apiKey}
                            className={clsx(
                                "px-4 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[90px]",
                                testStatus === 'error' && "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
                                testStatus === 'success' && "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                            )}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {testStatus === 'testing' ? (
                                    <motion.div
                                        key="testing"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Loader2 size={12} className="animate-spin" />
                                        <span>Testing</span>
                                    </motion.div>
                                ) : testStatus === 'success' ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Check size={12} strokeWidth={2.5} />
                                        <span>Working</span>
                                    </motion.div>
                                ) : testStatus === 'error' ? (
                                    <motion.div
                                        key="error"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="flex items-center gap-2"
                                    >
                                        <XCircle size={12} />
                                        <span>Failed</span>
                                    </motion.div>
                                ) : (
                                    <motion.span
                                        key="idle"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                    >
                                        Test Key
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges && saveState !== 'saved'}
                        className={clsx(
                            "px-6 py-2 rounded-lg text-xs font-medium transition-all duration-200 shadow-lg shadow-stone-200/50 dark:shadow-none flex items-center justify-center",
                            saveState === 'saved'
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : hasChanges
                                    ? "bg-primary text-primary-foreground hover:opacity-90"
                                    : "bg-muted/50 text-muted-foreground cursor-not-allowed shadow-none"
                        )}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {saveState === 'saved' ? (
                                <motion.div
                                    key="saved"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="flex items-center gap-2"
                                >
                                    <Check size={14} strokeWidth={2.5} />
                                    <span>Saved</span>
                                </motion.div>
                            ) : (
                                <motion.span
                                    key="save"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                >
                                    Save Changes
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>
        </div>
    );
};