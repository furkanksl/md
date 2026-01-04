import { Plus, Terminal, Code, MessageCircle, Music, Image, Settings, Folder } from 'lucide-react';
import { clsx } from 'clsx';

// Mock Data
const SHORTCUTS = [
  { id: '1', name: 'Terminal', icon: Terminal, color: 'bg-zinc-800 text-white' },
  { id: '2', name: 'VS Code', icon: Code, color: 'bg-blue-500 text-white' },
  { id: '3', name: 'Slack', icon: MessageCircle, color: 'bg-purple-500 text-white' },
  { id: '4', name: 'Spotify', icon: Music, color: 'bg-green-500 text-white' },
  { id: '5', name: 'Figma', icon: Image, color: 'bg-orange-500 text-white' },
  { id: '6', name: 'Finder', icon: Folder, color: 'bg-blue-400 text-white' },
  { id: '7', name: 'Settings', icon: Settings, color: 'bg-zinc-400 text-white' },
];

export const ShortcutsView = () => {
  return (
    <div className="flex flex-col h-full bg-pink-50/50 p-4">
      <div className="grid grid-cols-3 gap-3">
        {SHORTCUTS.map((app) => (
          <button 
            key={app.id}
            className="group flex flex-col items-center justify-center gap-2 aspect-square bg-white border-2 border-black rounded-xl hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <div className={clsx("p-3 rounded-xl border-2 border-black/10", app.color)}>
              <app.icon size={24} strokeWidth={2} />
            </div>
            <span className="text-xs font-bold text-zinc-700">{app.name}</span>
          </button>
        ))}
        
        {/* Add New Button */}
        <button 
          className="group flex flex-col items-center justify-center gap-2 aspect-square bg-transparent border-2 border-dashed border-black/30 rounded-xl hover:bg-white hover:border-solid hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <div className="p-3 rounded-xl bg-zinc-100 text-zinc-400 group-hover:text-black transition-colors">
            <Plus size={24} strokeWidth={2} />
          </div>
          <span className="text-xs font-bold text-zinc-400 group-hover:text-black">Add New</span>
        </button>
      </div>
    </div>
  );
};
