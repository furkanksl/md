import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '@/stores/settings-store';
import { clsx } from 'clsx';
import { Check, Shield, CircleCheck, CircleX, Loader2, EyeOff, PanelLeft, PanelRight, MousePointer2 } from 'lucide-react';
import { toast } from 'sonner';
import { getProvider } from '@/core/infra/ai/provider-factory';
import { streamText } from 'ai';

const PROVIDERS = [
    { id: 'openai', name: 'OpenAI', testModel: 'gpt-5-mini-2025-08-07' },
    { id: 'anthropic', name: 'Anthropic', testModel: 'claude-haiku-4-5-20251001' },
    { id: 'google', name: 'Google', testModel: 'gemini-3-flash-preview' },
    { id: 'mistral', name: 'Mistral', testModel: 'mistral-small-latest' },
    { id: 'groq', name: 'Groq', testModel: 'llama-3.3-70b-versatile' },
    { id: 'custom', name: 'Custom', testModel: 'auto' },
];

export const SettingsView = () => {
    const { activeProvider, setActiveProvider, setAIConfiguration, aiConfigurations, autoHide, setAutoHide, drawerPosition, setDrawerPosition } = useSettingsStore();
    const [apiKey, setApiKey] = useState('');
    const [endpoint, setEndpoint] = useState('');
    const [hasPermission, setHasPermission] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    useEffect(() => {
        checkPermission();
        const interval = setInterval(checkPermission, 1000);

        // Sync drawer position with backend
        invoke('set_drawer_config', { config: drawerPosition });

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

    // Sync drawer position when it changes
    useEffect(() => {
        invoke('set_drawer_config', { config: drawerPosition });
    }, [drawerPosition]);

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
        setTestStatus('idle');
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
        setTestStatus('idle');
    };

    const handleTestConnection = async () => {
        if (!apiKey) {
            toast.error("API Key missing", { description: "Please enter an API key to test." });
            return;
        }

        setTestStatus('testing');
        try {
            const providerConfig = PROVIDERS.find(p => p.id === activeProvider);
            const providerFactory = getProvider(activeProvider, apiKey);

            // Simple hello world test
            const result = await streamText({
                model: providerFactory(providerConfig?.testModel || 'gpt-4o-mini') as any,
                messages: [{ role: 'user', content: 'Say "1"' }],
            });

            // Consume stream to ensure connection works
            let response = "";
            for await (const chunk of result.textStream) {
                response += chunk;
            }

            if (response) {
                setTestStatus('success');
                toast.success("Connection Successful", { description: "API key is valid and working." });
            } else {
                throw new Error("No response received");
            }
        } catch (error) {
            console.error("Test failed:", error);
            setTestStatus('error');
            toast.error("Connection Failed", { description: "Could not connect to the provider. Check your API key." });
        }
    };

    return (
        <div className="h-full px-4 py-3 overflow-y-auto scrollbar-none space-y-6">

            {/* Behavior Section */}
            <div>
                <h2 className="text-xl font-light text-stone-800 dark:text-stone-200 mb-4">Behavior</h2>
                <div className="space-y-3">
                    <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] p-4 border border-stone-100 dark:border-stone-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    autoHide ? "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300" : "bg-stone-50 text-stone-400 dark:bg-stone-800/50 dark:text-stone-500"
                                )}>
                                    <EyeOff size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-stone-800 dark:text-stone-200">Auto-Hide</span>
                                    <span className="text-xs text-stone-500 dark:text-stone-400">
                                        Hide drawer when clicking outside
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setAutoHide(!autoHide)}
                                className={clsx(
                                    "w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out relative",
                                    autoHide ? "bg-stone-800 dark:bg-stone-100" : "bg-stone-200 dark:bg-stone-800"
                                )}
                            >
                                <div className={clsx(
                                    "w-5 h-5 rounded-full bg-white dark:bg-stone-900 shadow-sm transition-transform duration-300 ease-in-out",
                                    autoHide ? "translate-x-5" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-stone-900 rounded-[1.5rem] p-4 border border-stone-100 dark:border-stone-800 shadow-sm">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 flex items-center justify-center">
                                    {drawerPosition === 'left' ? <PanelLeft size={20} /> : drawerPosition === 'right' ? <PanelRight size={20} /> : <MousePointer2 size={20} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-stone-800 dark:text-stone-200">Drawer Position</span>
                                    <span className="text-xs text-stone-500 dark:text-stone-400">
                                        Choose where the drawer appears
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setDrawerPosition('left')}
                                    className={clsx(
                                        "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all h-10",
                                        drawerPosition === 'left'
                                            ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                                            : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800"
                                    )}
                                >
                                    <PanelLeft size={16} />
                                    <span className="text-[10px] font-medium uppercase tracking-wide">Left Edge</span>
                                </button>
                                <button
                                    onClick={() => setDrawerPosition('right')}
                                    className={clsx(
                                        "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all h-10",
                                        drawerPosition === 'right'
                                            ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                                            : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800"
                                    )}
                                >
                                    <PanelRight size={16} />
                                    <span className="text-[10px] font-medium uppercase tracking-wide">Right Edge</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setDrawerPosition('top-left')}
                                        className={clsx(
                                            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all h-16",
                                            drawerPosition === 'top-left'
                                                ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                                                : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800"
                                        )}
                                    >
                                        <div className="w-6 h-6 border-l-2 border-t-2 border-current rounded-tl-md" />
                                        <span className="text-[9px] font-medium uppercase tracking-wide">Top Left</span>
                                    </button>
                                    <button
                                        onClick={() => setDrawerPosition('bottom-left')}
                                        className={clsx(
                                            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all h-16",
                                            drawerPosition === 'bottom-left'
                                                ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                                                : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800"
                                        )}
                                    >
                                        <div className="w-6 h-6 border-l-2 border-b-2 border-current rounded-bl-md" />
                                        <span className="text-[9px] font-medium uppercase tracking-wide">Btm Left</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setDrawerPosition('top-right')}
                                        className={clsx(
                                            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all h-16",
                                            drawerPosition === 'top-right'
                                                ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                                                : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800"
                                        )}
                                    >
                                        <div className="w-6 h-6 border-r-2 border-t-2 border-current rounded-tr-md" />
                                        <span className="text-[9px] font-medium uppercase tracking-wide">Top Right</span>
                                    </button>
                                    <button
                                        onClick={() => setDrawerPosition('bottom-right')}
                                        className={clsx(
                                            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all h-16",
                                            drawerPosition === 'bottom-right'
                                                ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                                                : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800"
                                        )}
                                    >
                                        <div className="w-6 h-6 border-r-2 border-b-2 border-current rounded-br-md" />
                                        <span className="text-[9px] font-medium uppercase tracking-wide">Btm Right</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setDrawerPosition('hot-corners')}
                                className={clsx(
                                    "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all h-10 w-full",
                                    drawerPosition === 'hot-corners'
                                        ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                                        : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800"
                                )}
                            >
                                <MousePointer2 size={16} />
                                <span className="text-[10px] font-medium uppercase tracking-wide">All Hot Corners</span>
                            </button>
                        </div>
                    </div>
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

                    <div className="flex justify-end gap-2 mt-1">
                        <button
                            onClick={handleTestConnection}
                            disabled={testStatus === 'testing' || !apiKey}
                            className="px-4 py-2 bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 rounded-xl text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                        >
                            {testStatus === 'testing' ? 'Testing...' : 'Test Key'}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl text-xs font-medium hover:opacity-90 transition-opacity shadow-lg shadow-stone-200/50 dark:shadow-none"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
