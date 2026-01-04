import { useState } from 'react';
import { Globe, Loader2, Sparkles } from 'lucide-react';

export const ScrapingView = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-blue-50/50 p-4 gap-4">
      {/* Input Area */}
      <div className="flex flex-col gap-3 p-4 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Target URL</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border-2 border-zinc-200 rounded-lg focus-within:border-blue-500 transition-colors">
                <Globe size={16} className="text-zinc-400" />
                <input 
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-300 font-mono"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
            </div>
        </div>

        <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Extraction Prompt</label>
            <textarea 
                className="w-full h-20 p-3 bg-zinc-50 border-2 border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder:text-zinc-300"
                placeholder="Describe what data to extract..."
            />
        </div>

        <button 
            onClick={handleScrape}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-500 text-white font-bold rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isLoading ? 'PROCESSING...' : 'START SCRAPING'}
        </button>
      </div>

      {/* Recent Results */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Recent History</h3>
        <div className="flex-1 overflow-y-auto space-y-2 p-1">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-white border-2 border-zinc-100 rounded-xl hover:border-blue-200 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">COMPLETED</span>
                        <span className="text-[10px] text-zinc-400">2h ago</span>
                    </div>
                    <div className="text-sm font-bold truncate">https://news.ycombinator.com</div>
                    <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
                        Extracted 30 top stories with points and comments...
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
