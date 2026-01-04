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
    <div className="flex flex-col h-full px-8 py-4">
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
        <input 
            className="w-full bg-white h-12 rounded-2xl pl-12 pr-4 text-sm text-stone-600 placeholder:text-stone-300 focus:outline-none shadow-sm border border-stone-50 focus:shadow-md transition-shadow"
            placeholder="Search your collection..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-8 scrollbar-none">
        <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
                <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-stone-50 hover:shadow-md hover:-translate-y-1 transition-all group h-40 flex flex-col justify-between relative overflow-hidden"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-stone-300 group-hover:text-stone-500 transition-colors">
                            {item.from}
                        </span>
                        <span className="text-[10px] text-stone-300">{item.time}</span>
                    </div>
                    
                    <p className="text-stone-700 font-medium line-clamp-2 leading-relaxed">
                        {item.content}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="h-1 w-8 bg-stone-100 rounded-full group-hover:bg-stone-200 transition-colors" />
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleCopy(item.id, item.content); }}
                                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                                title="Copy"
                            >
                                {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={16} />
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
