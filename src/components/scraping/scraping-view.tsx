import { useState, useEffect, useMemo } from 'react';
import { useScrapingStore } from '@/stores/scraping-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ArrowRight, Loader2, Globe, Trash2, FileText, Bot, ChevronDown, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { MODELS } from '@/core/domain/models';
import * as Popover from '@radix-ui/react-popover';
import { webScrapingService } from '@/core/application/services/web-scraping-service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Markdown = ReactMarkdown as any;

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  mistral: "Mistral",
  groq: "Groq",
  custom: "Custom",
};

export const ScrapingView = () => {
  const { history, loadHistory, addScrapingTask, deleteTask, clearHistory } = useScrapingStore();
  const { aiConfigurations } = useSettingsStore();
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  // Compute available models based on configured providers
  const availableModels = useMemo(() => {
    const models: { id: string; name: string; provider: string }[] = [];
    
    Object.keys(aiConfigurations).forEach((provider) => {
      const config = aiConfigurations[provider];
      if (config && config.apiKey) {
        // Filter models from the domain definition
        const providerModels = MODELS.filter(m => m.provider === provider);
        providerModels.forEach((model) => {
          models.push({ id: model.id, name: model.name, provider: model.provider });
        });
      }
    });

    return models;
  }, [aiConfigurations]);

  // Set default model if none selected or current selection is invalid
  useEffect(() => {
    if (availableModels.length > 0) {
      if (!selectedModel || !availableModels.find(m => m.id === selectedModel)) {
        const firstModel = availableModels[0];
        if (firstModel) {
            setSelectedModel(firstModel.id);
        }
      }
    } else {
      setSelectedModel(null);
    }
  }, [availableModels, selectedModel]);

  const handleScrape = async () => {
    if (!url.trim() || !selectedModel) return;
    setIsLoading(true);
    
    try {
        const modelInfo = availableModels.find(m => m.id === selectedModel);
        if (!modelInfo) throw new Error("Model not found");

        const config = aiConfigurations[modelInfo.provider];
        if (!config) throw new Error("Provider configuration not found");

        let streamContent = "";
        
        // Use the Service
        await webScrapingService.scrapeAndAnalyze(
            url,
            prompt,
            selectedModel,
            modelInfo.provider,
            config.apiKey,
            (chunk) => {
                streamContent += chunk;
                // Live preview could be added here if we had a temporary state
            }
        );

        // Save to History (Stream finished)
        await addScrapingTask(url, prompt, streamContent);
        
        // Reset and show result
        setUrl('');
        setPrompt('');
        setSelectedResult(streamContent); 
    } catch (error) {
        console.error("Scraping failed:", error);
    } finally {
        setIsLoading(false);
    }
  };

  // Group models by provider for the dropdown
  const groupedModels = useMemo(() => {
    const groups: Record<string, { id: string; name: string; provider: string }[]> = {};
    availableModels.forEach(model => {
        if (!groups[model.provider]) {
            groups[model.provider] = [];
        }
        groups[model.provider]!.push(model);
    });
    return groups;
  }, [availableModels]);

  return (
    <div className="h-full px-4 py-3 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-xl font-light text-stone-800 dark:text-stone-200">Web Research</h2>
            <div className="flex items-center gap-2">
                {/* Model Selector */}
                {availableModels.length > 0 && selectedModel && (
                    <Popover.Root>
                        <Popover.Trigger asChild>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                                <Cpu size={14} />
                                <span>{availableModels.find(m => m.id === selectedModel)?.name}</span>
                                <ChevronDown size={14} className="text-stone-400" />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content className="z-50 min-w-[200px] bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 shadow-xl p-1 animate-in fade-in zoom-in-95 duration-200" sideOffset={5}>
                                <div className="max-h-[300px] overflow-y-auto scrollbar-none">
                                    {(Object.entries(groupedModels ?? {}) as [string, { id: string; name: string; provider: string }[]][]).map(([provider, models]) => {
                                        // Ensure models is defined before proceeding
                                        const modelList = models || [];
                                        if (modelList.length === 0) return null;

                                        return (
                                            <div key={provider} className="mb-2 last:mb-0">
                                                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                                    {PROVIDER_LABELS[provider] || provider}
                                                </div>
                                                {modelList.map(model => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => setSelectedModel(model.id)}
                                                        className={clsx(
                                                            "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between",
                                                            selectedModel === model.id
                                                                ? "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                                                                : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                                                        )}
                                                    >
                                                        {model.name}
                                                        {selectedModel === model.id && <div className="w-1.5 h-1.5 rounded-full bg-stone-800 dark:bg-stone-200" />}
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                )}
            </div>
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-stone-900 p-2 rounded-[1.5rem] shadow-lg shadow-stone-200/50 dark:shadow-none border border-stone-100 dark:border-stone-800 flex flex-col gap-1.5 shrink-0 mb-4 relative overflow-hidden">
            {isLoading && (
                <motion.div 
                    className="absolute bottom-0 left-0 h-1 bg-stone-800 dark:bg-stone-100 z-10"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "linear" }}
                />
            )}
            
            <div className="flex items-center px-3 pt-1">
                <Globe size={16} className="text-stone-400 mr-2" />
                <input 
                    className="flex-1 h-8 bg-transparent text-stone-700 dark:text-stone-300 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none font-mono text-xs"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                />
            </div>

            <div className="h-px bg-stone-100 dark:bg-stone-800 mx-3" />

            <div className="flex items-center px-3 pb-1">
                <Bot size={16} className="text-stone-400 mr-2" />
                <input 
                    className="flex-1 h-8 bg-transparent text-stone-700 dark:text-stone-300 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none text-xs"
                    placeholder="What do you want to find?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                />
                <button 
                    onClick={handleScrape}
                    disabled={isLoading || !url}
                    className="w-8 h-8 bg-stone-800 dark:bg-stone-100 rounded-full flex items-center justify-center text-white dark:text-stone-900 disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-300 dark:disabled:text-stone-600 transition-colors ml-2"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex gap-3 min-h-0">
            {/* History List */}
            <div className={clsx("flex-1 overflow-y-auto scrollbar-none space-y-2 transition-all flex flex-col", selectedResult ? "hidden md:block md:w-1/3" : "w-full")}>
                {history.length === 0 && (
                    <div className="text-center py-12 text-stone-400 flex flex-col items-center gap-3 opacity-50">
                        <FileText size={40} strokeWidth={1} />
                        <p className="text-sm">No research tasks yet.</p>
                    </div>
                )}
                
                {history.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={clsx(
                            "p-3 rounded-2xl border cursor-pointer transition-all hover:shadow-md group relative",
                            selectedResult === item.result 
                                ? "bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-900 border-stone-800 dark:border-stone-100 shadow-lg" 
                                : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-100 dark:border-stone-800 hover:border-stone-200 dark:hover:border-stone-700"
                        )}
                        onClick={() => setSelectedResult(item.result)}
                    >
                        <div className="flex justify-between items-start mb-1.5">
                            <span className={clsx("text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]", selectedResult === item.result ? "text-stone-400 dark:text-stone-500" : "text-stone-300 dark:text-stone-600")}>
                                {new URL(item.url).hostname}
                            </span>
                            <span className={clsx("text-[9px]", selectedResult === item.result ? "text-stone-500 dark:text-stone-400" : "text-stone-300 dark:text-stone-600")}>
                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="font-medium text-xs line-clamp-2 mb-1">{item.prompt || "No prompt provided"}</p>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteTask(item.id); if(selectedResult === item.result) setSelectedResult(null); }}
                            className={clsx(
                                "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg",
                                selectedResult === item.result ? "hover:bg-stone-700 dark:hover:bg-stone-200 text-stone-400 dark:text-stone-500" : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-600 hover:text-red-400"
                            )}
                        >
                            <Trash2 size={12} />
                        </button>
                    </motion.div>
                ))}

                {history.length > 0 && (
                    <div className="pt-2 flex justify-center mt-auto pb-2">
                        <button 
                            onClick={clearHistory}
                            className="text-stone-400 hover:text-red-400 text-[10px] uppercase tracking-wider font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                            <Trash2 size={12} />
                            Clear All History
                        </button>
                    </div>
                )}
            </div>

            {/* Detail View */}
            <AnimatePresence>
                {selectedResult && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="flex-[2] bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col absolute inset-0 md:static z-20"
                    >
                        <div className="p-3 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50 shrink-0">
                            <h3 className="font-bold text-stone-700 dark:text-stone-300 text-xs uppercase tracking-wide">Analysis Result</h3>
                            <button onClick={() => setSelectedResult(null)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full md:hidden">
                                <ArrowRight size={16} className="rotate-180 text-stone-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="prose prose-stone dark:prose-invert prose-xs max-w-none font-mono text-xs leading-relaxed break-words
                                prose-p:text-stone-600 dark:prose-p:text-stone-400 prose-p:my-2
                                prose-headings:font-bold prose-headings:text-stone-800 dark:prose-headings:text-stone-200 prose-headings:my-3 prose-headings:tracking-tight
                                prose-strong:font-bold prose-strong:text-stone-800 dark:prose-strong:text-stone-200
                                prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4
                                prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4
                                prose-li:my-0.5
                                prose-blockquote:border-l-2 prose-blockquote:border-stone-200 dark:prose-blockquote:border-stone-700 prose-blockquote:pl-3 prose-blockquote:italic
                                    prose-code:bg-stone-100 dark:prose-code:bg-stone-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
                            >
                                <Markdown 
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    components={{
                                        ul: ({...props}) => <ul className="list-disc pl-4 my-2 space-y-2" {...props} />,
                                        ol: ({...props}) => <ol className="list-decimal pl-7 my-2 space-y-2" {...props} />,
                                        li: ({...props}) => <li className="pl-1" {...props} />,
                                        strong: ({...props}) => <strong className="font-bold text-stone-800 dark:text-stone-200 mt-4 inline-block" {...props} />
                                    }}
                                >
                                    {selectedResult}
                                </Markdown>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};
