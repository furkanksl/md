import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ScrapingView = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRun = () => {
    if (!url) return;
    setIsLoading(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
        setProgress(p => {
            if (p >= 100) {
                clearInterval(interval);
                setTimeout(() => setIsLoading(false), 500);
                return 100;
            }
            return p + 2;
        });
    }, 50);
  };

  return (
    <div className="h-full px-8 flex flex-col justify-center gap-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-light text-stone-800">Web Reader</h2>
        <p className="text-stone-400">Extract content cleanly.</p>
      </div>

      <div className="bg-white p-2 rounded-[2rem] shadow-lg shadow-stone-200/50 border border-stone-100 flex items-center relative overflow-hidden">
        {isLoading && (
            <motion.div 
                className="absolute bottom-0 left-0 h-1 bg-stone-200"
                style={{ width: `${progress}%` }}
                layoutId="progress"
            />
        )}
        
        <input 
            className="flex-1 h-12 bg-transparent pl-6 pr-4 text-stone-600 placeholder:text-stone-300 focus:outline-none"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
        />
        
        <button 
            onClick={handleRun}
            disabled={isLoading || !url}
            className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center text-white disabled:bg-stone-100 disabled:text-stone-300 transition-colors shrink-0"
        >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {!isLoading && progress === 100 && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-stone-50 rounded-3xl p-6 text-center"
            >
                <p className="text-stone-500 font-medium">Extraction Complete</p>
                <p className="text-stone-400 text-sm mt-1">Data saved to clipboard</p>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
