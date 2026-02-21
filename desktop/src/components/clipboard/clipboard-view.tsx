import { useState, useEffect, memo, useCallback } from 'react';
import { useClipboardStore } from '@/stores/clipboard-store';
import { useSettingsStore } from '@/stores/settings-store';
import { Search, Copy, Trash2, Check, History, ChevronDown, X, Calendar, Image as ImageIcon } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const ClipboardItem = memo(({ item, onCopy, onDelete, onClick, copiedId }: { item: any, onCopy: (id: string, content: string) => void, onDelete: (id: string) => void, onClick: (item: any) => void, copiedId: string | null }) => {
    const isImage = item.content.startsWith('data:image');

    return (
        <div
            onClick={() => onClick(item)}
            className="bg-card p-4 rounded-lg shadow-sm border border-border hover:shadow-md hover:-translate-y-1 transition-all group h-32 flex flex-col justify-between relative overflow-hidden cursor-pointer"
        >
            <div className="flex justify-end items-start mb-2">
                <span className="text-[9px] text-muted-foreground/60">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
                {isImage ? (
                    <div className="w-full h-full rounded-md overflow-hidden bg-muted flex items-center justify-center relative">
                        <img src={item.content} alt="Clipboard Content" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                            <ImageIcon size={16} className="text-white drop-shadow-md" />
                        </div>
                    </div>
                ) : (
                    <p className="text-foreground text-sm font-medium line-clamp-3 leading-relaxed break-words">
                        {item.content}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
                <div className="h-1 w-6 bg-muted rounded-full group-hover:bg-muted-foreground/20 transition-colors" />

                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onCopy(item.id, item.content); }}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors"
                        title="Copy"
                    >
                        {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
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
    const { items, loadHistory, startMonitoring, deleteItem, isMonitoring, hasMore, offset } = useClipboardStore();
    const { clipboardHistoryLimit, setClipboardHistoryLimit } = useSettingsStore();
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const pageSize = 50;

    useEffect(() => {
        if (items.length === 0) {
            loadHistory({ limit: pageSize, offset: 0, append: false });
        }
        if (!isMonitoring) {
            startMonitoring();
        }
    }, []);

    useEffect(() => {
        loadHistory({ limit: pageSize, offset: 0, append: false });
    }, [clipboardHistoryLimit]);

    const filtered = items.filter(item =>
        item.content.toLowerCase().includes(search.toLowerCase()) ||
        (item.content.startsWith('data:image') && 'image'.includes(search.toLowerCase()))
    );

    const handleCopy = useCallback(async (id: string, content: string) => {
        if (content.startsWith('data:image')) {
            try {
                const res = await fetch(content);
                const blob = await res.blob();
                // Use ClipboardItem API for images
                // @ts-ignore - ClipboardItem might be missing in some TS environments
                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            } catch (e) {
                console.error("Failed to copy image:", e);
            }
        } else {
            navigator.clipboard.writeText(content);
        }
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    const handleDelete = useCallback((id: string) => {
        deleteItem(id);
        if (selectedItem?.id === id) {
            setSelectedItem(null);
        }
    }, [deleteItem, selectedItem]);

    const LIMIT_OPTIONS = [10, 20, 30, 50, 100, 0];

    return (
        <div className="flex flex-col h-full px-4 pt-1 relative overflow-hidden">
            <div className="relative mb-2 flex gap-2 shrink-0">
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
                                    {limit === 0 ? `Keep All` : `Last ${limit}`}
                                    {clipboardHistoryLimit === limit && <div className="w-1.5 h-1.5 rounded-full bg-stone-800 dark:bg-stone-200" />}
                                </button>
                            ))}
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
            </div>

            <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4 pt-6 px-1 -mx-1 scrollbar-none flex-1 min-h-0">
                {filtered.map((item) => (
                    <ClipboardItem
                        key={item.id}
                        item={item}
                        onCopy={handleCopy}
                        onDelete={handleDelete}
                        onClick={setSelectedItem}
                        copiedId={copiedId}
                    />
                ))}
                {filtered.length > 0 && hasMore && (
                    <div className="col-span-2 flex justify-center pb-3">
                        <button
                            onClick={async () => {
                                if (isLoadingMore) return;
                                setIsLoadingMore(true);
                                try {
                                    await loadHistory({ limit: pageSize, offset, append: true });
                                } finally {
                                    setIsLoadingMore(false);
                                }
                            }}
                            className="text-muted-foreground hover:text-foreground text-[10px] uppercase tracking-wider font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted"
                            disabled={isLoadingMore}
                        >
                            {isLoadingMore ? (
                                <>
                                    <ChevronDown size={12} className="animate-pulse" />
                                    Loading
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={12} />
                                    Load More
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute inset-0 z-50 bg-background flex flex-col"
                    >
                        {/* Modal Header */}
                        <div className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-stone-100 dark:border-stone-800">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-2 -ml-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-500"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">Details</span>
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                                        {selectedItem.content.startsWith('data:image') ? 'Image' : `${selectedItem.character_count || selectedItem.content.length} chars`}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleCopy(selectedItem.id, selectedItem.content)}
                                    className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                                    title="Copy"
                                >
                                    {copiedId === selectedItem.id ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                                <button
                                    onClick={() => { handleDelete(selectedItem.id); }}
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-stone-400 hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 pb-2 flex items-center justify-center">
                            {selectedItem.content.startsWith('data:image') ? (
                                <div className="max-w-full max-h-full rounded-2xl shadow-sm border border-stone-50 dark:border-stone-800 overflow-hidden">
                                    <img src={selectedItem.content} alt="Full Content" className="max-w-full max-h-full object-contain" />
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-50 dark:border-stone-800 w-full min-h-full whitespace-pre-wrap font-mono text-sm text-stone-700 dark:text-stone-300 leading-relaxed selection:bg-stone-200 dark:selection:bg-stone-700">
                                    {selectedItem.content}
                                </div>
                            )}
                        </div>

                        {/* Footer Metadata */}
                        <div className="h-12 bg-white dark:bg-stone-900 border-t rounded-2xl border-stone-100 dark:border-stone-800 flex items-center justify-center px-6 mx-4 shrink-0 text-xs text-stone-400">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>{new Date(selectedItem.timestamp).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                })}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
