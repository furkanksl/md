import { useState } from 'react';
import { Search, Copy, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_DATA = [
  { id: '1', content: 'https://dribbble.com/shots/minimal-ui', type: 'link', from: 'Safari', time: '2m' },
  { id: '2', content: 'Design System V2 Colors', type: 'text', from: 'Figma', time: '1h' },
  { id: '3', content: 'rgb(245, 245, 244)', type: 'color', from: 'VS Code', time: '3h' },
  { id: '4', content: 'Meeting notes for Q4 planning', type: 'text', from: 'Notion', time: '5h' },
];

export const ClipboardView = () => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(MOCK_DATA);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = items.filter(item => 
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

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
        <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
                <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-stone-900 p-4 rounded-[1.25rem] shadow-sm border border-stone-50 dark:border-stone-800 hover:shadow-md hover:-translate-y-1 transition-all group h-32 flex flex-col justify-between relative overflow-hidden"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold tracking-widest uppercase text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors">
                            {item.from}
                        </span>
                        <span className="text-[9px] text-stone-300 dark:text-stone-600">{item.time}</span>
                    </div>
                    
                    <p className="text-stone-700 dark:text-stone-300 text-sm font-medium line-clamp-2 leading-relaxed">
                        {item.content}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-1">
                        <div className="h-1 w-6 bg-stone-100 dark:bg-stone-800 rounded-full group-hover:bg-stone-200 dark:group-hover:bg-stone-700 transition-colors" />
                        
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleCopy(item.id, item.content); }}
                                className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                                title="Copy"
                            >
                                {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
