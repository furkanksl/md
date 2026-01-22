import { useState, useEffect, memo, useCallback } from 'react';
import { useClipboardStore } from '@/stores/clipboard-store';
import { useSettingsStore } from '@/stores/settings-store';
import { Search, Copy, Trash2, Check, History, ChevronDown } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { clsx } from 'clsx';

const ClipboardItem = memo(({ item, onCopy, onDelete, copiedId }: { item: any, onCopy: (id: string, content: string) => void, onDelete: (id: string) => void, copiedId: string | null }) => {
    return (
        <div
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
        </div>
    );
}, (prev, next) => {
    return prev.item.id === next.item.id && 
           prev.item.content === next.item.content && 
           prev.copiedId === next.copiedId;
});

export const ClipboardView = () => {
  const { items, loadHistory, startMonitoring, deleteItem, isMonitoring } = useClipboardStore();
  const { clipboardHistoryLimit, setClipboardHistoryLimit } = useSettingsStore();
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

  // Reload history when limit changes to reflect truncation immediately if needed
  useEffect(() => {
    loadHistory();
  }, [clipboardHistoryLimit]);

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

  const LIMIT_OPTIONS = [10, 20, 30, 50, 100, 0]; // 0 for All

  return (
    <div className="flex flex-col h-full px-4 py-3">
      <div className="relative mb-6 flex gap-2">
        <div className="relative flex-1 transition-all">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600" size={16} />
            <input 
                className="w-full bg-white dark:bg-stone-900 h-10 rounded-xl pl-10 pr-4 text-sm text-stone-600 dark:text-stone-300 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none shadow-sm border border-stone-50 dark:border-stone-800 focus:shadow-md transition-shadow"
                placeholder="Search your collection..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        
        <Popover.Root>
            <Popover.Trigger asChild>
                <button className="transition-all h-10 px-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-50 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors flex items-center gap-2 shadow-sm">
                    <History size={16} />
                    <span className="text-xs font-medium">
                        {clipboardHistoryLimit === 0 ? 'All' : `Last ${clipboardHistoryLimit}`}
                    </span>
                    <ChevronDown size={14} className="opacity-50" />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content className="z-50 min-w-[120px] bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 shadow-xl p-1 animate-in fade-in zoom-in-95 duration-200" sideOffset={5} align="end">
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        History Limit
                    </div>
                    {LIMIT_OPTIONS.map(limit => (
                        <button
                            key={limit}
                            onClick={() => setClipboardHistoryLimit(limit)}
                            className={clsx(
                                "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between",
                                clipboardHistoryLimit === limit
                                    ? "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                                    : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                            )}
                        >
                            {limit === 0 ? `Keep All (${items.length})` : `Last ${limit}`}
                            {clipboardHistoryLimit === limit && <div className="w-1.5 h-1.5 rounded-full bg-stone-800 dark:bg-stone-200" />}
                        </button>
                    ))}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4 px-1 -mx-1 scrollbar-none">
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
