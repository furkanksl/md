import { Box, LayoutPanelLeft, Grid2X2 } from 'lucide-react';
import { motion } from 'framer-motion';

const PRESETS = [
    { id: '1', name: 'Focus', icon: Box, desc: 'Single centered window' },
    { id: '2', name: 'Split', icon: LayoutPanelLeft, desc: 'Side by side view' },
    { id: '3', name: 'Grid', icon: Grid2X2, desc: 'Four quadrant view' },
];

export const LayoutsView = () => {
  return (
    <div className="h-full px-8 py-4 flex flex-col gap-8">
      {/* Current State Visualization */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-stone-50 flex items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-stone-50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative z-10 text-center">
            <h3 className="text-2xl font-light text-stone-800 mb-2">Workspace A</h3>
            <p className="text-stone-400 text-sm">3 windows active</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-medium text-stone-400 ml-2">Presets</h4>
        {PRESETS.map((p, i) => (
            <motion.button 
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-4 rounded-3xl flex items-center gap-4 hover:shadow-md hover:shadow-stone-200/50 transition-all group border border-stone-50"
            >
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-stone-800 group-hover:text-white transition-colors duration-300">
                    <p.icon size={20} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <h5 className="text-stone-700 font-medium group-hover:text-stone-900 transition-colors">{p.name}</h5>
                    <p className="text-stone-400 text-xs">{p.desc}</p>
                </div>
            </motion.button>
        ))}
      </div>
    </div>
  );
};
