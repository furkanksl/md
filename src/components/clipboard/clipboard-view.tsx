import { useState } from 'react';
import { Search, Copy, Trash2, Pin } from 'lucide-react';
import { clsx } from 'clsx';

// Mock Data
const MOCK_CLIPBOARD = [
  { id: '1', content: 'https://tauri.app/v1/guides/', type: 'url', app: 'Arc', time: '2m ago', pinned: true },
  { id: '2', content: 'const { activeView, setActiveView } = useUIStore();', type: 'code', app: 'VS Code', time: '15m ago', pinned: false },
  { id: '3', content: 'Meeting notes: Discuss the new brutalist design direction.', type: 'text', app: 'Notion', time: '1h ago', pinned: false },
  { id: '4', content: '#ffde59', type: 'color', app: 'Figma', time: '2h ago', pinned: false },
  { id: '5', content: 'npm install lucide-react', type: 'code', app: 'Terminal', time: '4h ago', pinned: false },
];

export const ClipboardView = () => {
  const [search, setSearch] = useState('');

  const filteredItems = MOCK_CLIPBOARD.filter(item => 
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-orange-50/50">
      {/* Search Header */}
      <div className="p-4 border-b-2 border-black/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-black rounded-xl focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-zinc-400"
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredItems.map((item) => (
          <div 
            key={item.id}
            className="group flex flex-col gap-2 p-3 bg-white border-2 border-black rounded-xl hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded border border-orange-200">
                  {item.app}
                </span>
                <span className="text-[10px] text-zinc-400">{item.time}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className={clsx("p-1.5 rounded-lg hover:bg-zinc-100 transition-colors", item.pinned && "text-yellow-500 hover:bg-yellow-50 opacity-100")}>
                  <Pin size={14} strokeWidth={2.5} fill={item.pinned ? "currentColor" : "none"} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
                  <Copy size={14} strokeWidth={2.5} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Trash2 size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
            <div className="text-sm font-medium text-zinc-800 line-clamp-2 break-all font-mono">
              {item.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
