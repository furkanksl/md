import { useState, useEffect } from 'react';
import { useScrapingStore } from '@/stores/scraping-store';
import { invoke } from '@tauri-apps/api/core';
import { ArrowRight, Loader2, Globe, Trash2, FileText, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export const ScrapingView = () => {
  const { history, loadHistory, addScrapingTask, deleteTask, clearHistory } = useScrapingStore();
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const handleScrape = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    
    try {
        // 1. Fetch & Sanitize
        const textContent = await invoke<string>('fetch_webpage', { url });
        
        // 2. Simulate AI Processing (Mock for now, normally would send textContent + prompt to LLM)
        // In a real app, this is where you'd call 'chat_completion' or similar.
        const aiResponse = `[Simulated AI Analysis for "${prompt}"]\n\nBased on the content from ${url}:\n\n${textContent.substring(0, 300)}...`;

        // 3. Save to History
        await addScrapingTask(url, prompt, aiResponse);
        
        // 4. Reset
        setUrl('');
        setPrompt('');
        setSelectedResult(aiResponse); // Auto-open result
    } catch (error) {
        console.error("Scraping failed:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="h-full px-4 py-3 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-xl font-light text-stone-800 dark:text-stone-200">Web Research</h2>
            {history.length > 0 && (
                <button 
                    onClick={clearHistory}
                    className="text-stone-400 hover:text-red-400 text-[10px] uppercase tracking-wider font-medium transition-colors"
                >
                    Clear History
                </button>
            )}
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
            <div className={clsx("flex-1 overflow-y-auto scrollbar-none space-y-2 transition-all", selectedResult ? "hidden md:block md:w-1/3" : "w-full")}>
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
                        <div className="p-3 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50">
                            <h3 className="font-bold text-stone-700 dark:text-stone-300 text-xs uppercase tracking-wide">Analysis Result</h3>
                            <button onClick={() => setSelectedResult(null)} className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full md:hidden">
                                <ArrowRight size={16} className="rotate-180 text-stone-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-wrap">
                            {selectedResult}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};