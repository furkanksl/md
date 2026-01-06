import { useState, useEffect, memo, useCallback } from 'react';
import { useClipboardStore } from '@/stores/clipboard-store';
import { Search, Copy, Trash2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const ClipboardItem = memo(({ item, onCopy, onDelete, copiedId }: { item: any, onCopy: (id: string, content: string) => void, onDelete: (id: string) => void, copiedId: string | null }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            className="bg-white dark:bg-stone-900 p-4 rounded-[1.25rem] shadow-sm border border-stone-50 dark:border-stone-800 hover:shadow-md hover:-translate-y-1 transition-all group h-32 flex flex-col justify-between relative overflow-hidden"
        >
            <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold tracking-widest uppercase text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors">
                    {item.source_app || 'System'}
                </span>
                <span className="text-[9px] text-stone-300 dark:text-stone-600">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            
            <p className="text-stone-700 dark:text-stone-300 text-sm font-medium line-clamp-2 leading-relaxed break-words">
                {item.content}
            </p>

            <div className="flex items-center justify-between mt-auto pt-1">
                <div className="h-1 w-6 bg-stone-100 dark:bg-stone-800 rounded-full group-hover:bg-stone-200 dark:group-hover:bg-stone-700 transition-colors" />
                
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onCopy(item.id, item.content); }}
                        className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                        title="Copy"
                    >
                        {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}, (prev, next) => {
    return prev.item.id === next.item.id && 
           prev.item.content === next.item.content && 
           prev.copiedId === next.copiedId;
});

export const ClipboardView = () => {
  const { items, loadHistory, startMonitoring, deleteItem, isMonitoring } = useClipboardStore();
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Only load if empty to prevent flash/re-render on tab switch
    if (items.length === 0) {
        loadHistory();
    }
    // Monitoring is idempotent but good to check
    if (!isMonitoring) {
        startMonitoring();
    }
  }, []);

  const filtered = items.filter(item => 
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteItem(id);
  }, [deleteItem]);

  return (
    <div className="flex flex-col h-full px-4 py-3">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600" size={16} />
        <input 
            className="w-full bg-white dark:bg-stone-900 h-10 rounded-xl pl-10 pr-4 text-sm text-stone-600 dark:text-stone-300 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none shadow-sm border border-stone-50 dark:border-stone-800 focus:shadow-md transition-shadow"
            placeholder="Search your collection..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4 scrollbar-none">
        {filtered.map((item) => (
            <ClipboardItem 
                key={item.id} 
                item={item} 
                onCopy={handleCopy} 
                onDelete={handleDelete} 
                copiedId={copiedId} 
            />
        ))}
      </div>
    </div>
  );
};
