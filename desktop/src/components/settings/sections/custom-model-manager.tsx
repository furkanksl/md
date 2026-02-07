import { useState } from 'react';
import { clsx } from 'clsx';
import { Check, Plus, Trash2, Pencil, Play, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateText, LanguageModel } from 'ai';
import { CustomModel } from '@/types/ai';

interface CustomModelManagerProps {
    customModels: CustomModel[];
    onUpdate: (models: CustomModel[]) => void;
}

export const CustomModelManager = ({ customModels, onUpdate }: CustomModelManagerProps) => {
    // ... (state declarations remain same)
    const [editingModelId, setEditingModelId] = useState<string | null>(null);
    const [newModelName, setNewModelName] = useState('');
    const [newModelId, setNewModelId] = useState('');
    const [newBaseUrl, setNewBaseUrl] = useState('');
    const [newModelApiKey, setNewModelApiKey] = useState('');
    const [testingModelId, setTestingModelId] = useState<string | null>(null);

    const resetForm = () => {
        setNewModelName('');
        setNewModelId('');
        setNewBaseUrl('');
        setNewModelApiKey('');
        setEditingModelId(null);
    };

    // ... (handleAddOrUpdateCustomModel, handleEditCustomModel, handleRemoveCustomModel remain same)
    const handleAddOrUpdateCustomModel = () => {
        if (!newModelName || !newModelId || !newBaseUrl) {
            toast.error("Missing fields", { description: "Name, Model ID, and Base URL are required." });
            return;
        }

        let cleanBaseUrl = newBaseUrl.trim();
        
        // Helper to remove trailing slash
        const removeTrailingSlash = (url: string) => {
            while (url.endsWith('/')) {
                url = url.slice(0, -1);
            }
            return url;
        };

        cleanBaseUrl = removeTrailingSlash(cleanBaseUrl);
        
        if (cleanBaseUrl.endsWith('/chat/completions')) {
            cleanBaseUrl = cleanBaseUrl.slice(0, -'/chat/completions'.length);
        }
        
        cleanBaseUrl = removeTrailingSlash(cleanBaseUrl);

        if (editingModelId) {
            // Update existing
            onUpdate(customModels.map(m => 
                m.id === editingModelId 
                    ? { ...m, name: newModelName, modelId: newModelId, baseUrl: cleanBaseUrl, apiKey: newModelApiKey }
                    : m
            ));
            toast.success("Model Updated");
        } else {
            // Add new
            const newModel: CustomModel = {
                id: `custom-${Date.now()}`,
                name: newModelName,
                provider: 'custom',
                baseUrl: cleanBaseUrl,
                apiKey: newModelApiKey,
                modelId: newModelId
            };
            onUpdate([...customModels, newModel]);
            toast.success("Model Added");
        }
        resetForm();
    };

    const handleEditCustomModel = (model: CustomModel) => {
        setNewModelName(model.name);
        setNewModelId(model.modelId);
        setNewBaseUrl(model.baseUrl);
        setNewModelApiKey(model.apiKey || '');
        setEditingModelId(model.id);
    };

    const handleRemoveCustomModel = (id: string) => {
        onUpdate(customModels.filter(m => m.id !== id));
        if (editingModelId === id) {
            resetForm();
        }
    };

    const handleTestModel = async (model: CustomModel) => {
        setTestingModelId(model.id);
        try {
            const { createOpenAI } = await import("@ai-sdk/openai");
            const { customFetch } = await import("@/core/infra/ai/custom-fetch");
            
            console.log(`[Settings] Creating provider with baseURL: ${model.baseUrl}`);
            
            const customProvider = createOpenAI({
                baseURL: model.baseUrl,
                apiKey: model.apiKey || 'not-needed',
                fetch: customFetch
            });
            
            console.log(`[Settings] Testing custom model: ${model.name} (${model.baseUrl})`);
            
            // Explicitly use .chat() to ensure we target /chat/completions
            const modelInstance = customProvider.chat 
                ? customProvider.chat(model.modelId) 
                : customProvider(model.modelId);

            const result = await generateText({
                model: modelInstance as LanguageModel,
                messages: [{ role: 'user', content: 'Say "1"' }],
            });

            console.log(`[Settings] Test result:`, result);

            if (result.text) {
                toast.success("Connection Successful", { description: `${model.name} is working.` });
            } else {
                throw new Error("Empty response received.");
            }
        } catch (error: unknown) {
            console.error("Custom model test failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Could not connect to the model.";
            toast.error("Connection Failed", { description: errorMessage });
        } finally {
            setTestingModelId(null);
        }
    };

    // ... (JSX return remains the same)
    return (
        <div className="space-y-4">
             {/* List existing custom models */}
            {customModels.length > 0 && (
                <div className="space-y-2">
                     <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                        Configured Models
                    </label>
                    <div className="flex flex-col gap-2">
                        {customModels.map(model => (
                            <div key={model.id} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
                                <div className="flex flex-col overflow-hidden mr-2">
                                    <span className="text-xs font-medium text-stone-700 dark:text-stone-200">{model.name}</span>
                                    <span className="text-[10px] text-stone-400 truncate font-mono">{model.modelId}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleTestModel(model)}
                                        disabled={!!testingModelId}
                                        className={clsx(
                                            "p-1.5 rounded-lg transition-colors",
                                            testingModelId === model.id 
                                                ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                                : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                                        )}
                                        title="Test Connection"
                                    >
                                        {testingModelId === model.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                    </button>
                                    <button 
                                        onClick={() => handleEditCustomModel(model)}
                                        className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                                        title="Edit Model"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleRemoveCustomModel(model.id)}
                                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Remove Model"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add new model form */}
            <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                        {editingModelId ? 'Edit Model' : 'Add New Model'}
                    </label>
                    {editingModelId && (
                        <button 
                            onClick={resetForm} 
                            className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-1"
                        >
                            <X size={10} /> Cancel
                        </button>
                    )}
                </div>
                <input
                    className="w-full bg-stone-50 dark:bg-stone-800 h-9 rounded-xl px-3 text-stone-600 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 transition-all text-xs"
                    placeholder="Display Name (e.g. Local Mistral)"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-medium text-stone-400 uppercase tracking-wide ml-1">Model ID</label>
                        <input
                            className="w-full bg-stone-50 dark:bg-stone-800 h-9 rounded-xl px-3 text-stone-600 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 transition-all font-mono text-xs"
                            placeholder="mistralai/ministral-3-3b"
                            value={newModelId}
                            onChange={(e) => setNewModelId(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-medium text-stone-400 uppercase tracking-wide ml-1">Base URL</label>
                        <input
                            className="w-full bg-stone-50 dark:bg-stone-800 h-9 rounded-xl px-3 text-stone-600 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 transition-all font-mono text-xs"
                            placeholder="http://localhost:1234/v1"
                            value={newBaseUrl}
                            onChange={(e) => setNewBaseUrl(e.target.value)}
                        />
                    </div>
                </div>
                <input
                    type="password"
                    className="w-full bg-stone-50 dark:bg-stone-800 h-9 rounded-xl px-3 text-stone-600 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 transition-all font-mono text-xs"
                    placeholder="API Key (Optional)"
                    value={newModelApiKey}
                    onChange={(e) => setNewModelApiKey(e.target.value)}
                />
                <button
                    onClick={handleAddOrUpdateCustomModel}
                    disabled={!newModelName || !newModelId || !newBaseUrl}
                    className={clsx(
                        "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50",
                        editingModelId 
                            ? "bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90"
                            : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                    )}
                >
                    {editingModelId ? <Check size={14} /> : <Plus size={14} />}
                    <span>{editingModelId ? 'Update Model' : 'Add Model'}</span>
                </button>
            </div>
        </div>
    );
};