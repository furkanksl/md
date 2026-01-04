import { Layout, Maximize, Columns, Grid, Monitor, ArrowRight } from 'lucide-react';

const LAYOUTS = [
  { id: '1', name: 'Focus', icon: Maximize, desc: 'Single centered window' },
  { id: '2', name: 'Split', icon: Columns, desc: 'Two windows side-by-side' },
  { id: '3', name: 'Grid', icon: Grid, desc: 'Four quadrant grid' },
  { id: '4', name: 'Sidebar', icon: Layout, desc: 'Main window with sidebar' },
];

export const LayoutsView = () => {
  return (
    <div className="flex flex-col h-full bg-green-50/50 p-4 gap-4">
      {/* Current State */}
      <div className="p-4 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Monitor size={16} /> Current Desktop
        </h3>
        <div className="aspect-video bg-zinc-100 rounded-lg border-2 border-zinc-200 relative overflow-hidden flex items-center justify-center">
            <span className="text-xs text-zinc-400 font-mono">CAPTURING_STATE...</span>
        </div>
        <button className="mt-3 w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-800 transition-colors">
            Save Current Layout
        </button>
      </div>

      {/* Saved Layouts */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Saved Layouts</h3>
        <div className="grid grid-cols-1 gap-2">
            {LAYOUTS.map((layout) => (
                <button 
                    key={layout.id}
                    className="flex items-center gap-3 p-3 bg-white border-2 border-black rounded-xl hover:bg-green-50 transition-colors group text-left"
                >
                    <div className="p-2 bg-green-100 border-2 border-black rounded-lg">
                        <layout.icon size={18} strokeWidth={2.5} className="text-green-800" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-bold">{layout.name}</div>
                        <div className="text-[10px] text-zinc-500">{layout.desc}</div>
                    </div>
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};
