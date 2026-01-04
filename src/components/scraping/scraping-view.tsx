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
    <div className="h-full px-6 py-4 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-2xl font-light text-stone-800">Web Research</h2>
            {history.length > 0 && (
                <button 
                    onClick={clearHistory}
                    className="text-stone-400 hover:text-red-400 text-xs uppercase tracking-wider font-medium transition-colors"
                >
                    Clear History
                </button>
            )}
        </div>

        {/* Input Area */}
        <div className="bg-white p-2 rounded-[2rem] shadow-lg shadow-stone-200/50 border border-stone-100 flex flex-col gap-2 shrink-0 mb-6 relative overflow-hidden">
            {isLoading && (
                <motion.div 
                    className="absolute bottom-0 left-0 h-1 bg-stone-800 z-10"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "linear" }}
                />
            )}
            
            <div className="flex items-center px-4 pt-2">
                <Globe size={18} className="text-stone-400 mr-3" />
                <input 
                    className="flex-1 h-10 bg-transparent text-stone-700 placeholder:text-stone-300 focus:outline-none font-mono text-sm"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                />
            </div>

            <div className="h-px bg-stone-100 mx-4" />

            <div className="flex items-center px-4 pb-2">
                <Bot size={18} className="text-stone-400 mr-3" />
                <input 
                    className="flex-1 h-10 bg-transparent text-stone-700 placeholder:text-stone-300 focus:outline-none text-sm"
                    placeholder="What do you want to find?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                />
                <button 
                    onClick={handleScrape}
                    disabled={isLoading || !url}
                    className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-white disabled:bg-stone-100 disabled:text-stone-300 transition-colors ml-2"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex gap-4 min-h-0">
            {/* History List */}
            <div className={clsx("flex-1 overflow-y-auto scrollbar-none space-y-3 transition-all", selectedResult ? "hidden md:block md:w-1/3" : "w-full")}>
                {history.length === 0 && (
                    <div className="text-center py-12 text-stone-400 flex flex-col items-center gap-4 opacity-50">
                        <FileText size={48} strokeWidth={1} />
                        <p>No research tasks yet.</p>
                    </div>
                )}
                
                {history.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={clsx(
                            "p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md group relative",
                            selectedResult === item.result 
                                ? "bg-stone-800 text-stone-50 border-stone-800 shadow-lg" 
                                : "bg-white text-stone-700 border-stone-100 hover:border-stone-200"
                        )}
                        onClick={() => setSelectedResult(item.result)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={clsx("text-xs font-bold uppercase tracking-widest truncate max-w-[150px]", selectedResult === item.result ? "text-stone-400" : "text-stone-300")}>
                                {new URL(item.url).hostname}
                            </span>
                            <span className={clsx("text-[10px]", selectedResult === item.result ? "text-stone-500" : "text-stone-300")}>
                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="font-medium text-sm line-clamp-2 mb-1">{item.prompt || "No prompt provided"}</p>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteTask(item.id); if(selectedResult === item.result) setSelectedResult(null); }}
                            className={clsx(
                                "absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg",
                                selectedResult === item.result ? "hover:bg-stone-700 text-stone-400" : "hover:bg-stone-100 text-stone-400 hover:text-red-400"
                            )}
                        >
                            <Trash2 size={14} />
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
                        className="flex-[2] bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden flex flex-col absolute inset-0 md:static z-20"
                    >
                        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <h3 className="font-bold text-stone-700 text-sm uppercase tracking-wide">Analysis Result</h3>
                            <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-stone-100 rounded-full md:hidden">
                                <ArrowRight size={18} className="rotate-180 text-stone-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                            {selectedResult}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};