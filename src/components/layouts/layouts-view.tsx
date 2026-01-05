import { useState, useEffect } from 'react';
import { useLayoutsStore, WindowInfo } from '@/stores/layouts-store';
import { invoke } from '@tauri-apps/api/core';
import { 
  Plus, 
  Trash2, 
  Layout, 
  Monitor, 
    ArrowRight,
    Laptop,
    Columns2,
    Columns3,
    Rows2,
    Grid2X2,
    LayoutPanelLeft,
    Layers as LayersIcon
  } from 'lucide-react';import { motion, AnimatePresence } from 'framer-motion';

export const LayoutsView = () => {
  const { layouts, loadLayouts, saveLayout, deleteLayout } = useLayoutsStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureName, setCaptureName] = useState('');
  const [capturedWindows, setCapturedWindows] = useState<WindowInfo[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadLayouts();
  }, []);

  const handleCaptureStart = async () => {
    try {
      const windows = await invoke<WindowInfo[]>('get_windows');
      setCapturedWindows(windows);
      setPreviewMode(true);
      setCaptureName(`Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      console.error('Failed to capture windows:', err);
    }
  };

  const handleSaveConfirm = async () => {
    if (!captureName.trim()) return;
    setIsCapturing(true);
    await saveLayout(captureName, capturedWindows);
    setIsCapturing(false);
    setPreviewMode(false);
    setCapturedWindows([]);
  };

  const handleRestore = async (windows: WindowInfo[]) => {
    try {
        await invoke('restore_layout', { windows });
    } catch (err) {
        console.error('Failed to restore layout:', err);
    }
  };

  const handlePreset = async (layout: string) => {
    try {
        await invoke('apply_preset_layout', { layout });
    } catch (err) {
        console.error('Failed to apply preset:', err);
    }
  };

  return (
    <div className="h-full px-4 py-3 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-xl font-light text-stone-800 dark:text-stone-200">Window Flow</h2>
        {!previewMode && (
            <button 
            onClick={handleCaptureStart}
            className="flex items-center gap-1.5 bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors shadow-lg shadow-stone-200/50 dark:shadow-none"
            >
            <Plus size={14} />
            <span>Capture</span>
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-4 scrollbar-none min-h-0">
        <AnimatePresence mode="wait">
            {previewMode ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-xl shadow-stone-200/50 dark:shadow-black/50"
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-1">
                            <Monitor size={16} />
                            <span className="text-xs font-medium">{capturedWindows.length} windows detected</span>
                        </div>

                        <div className="bg-stone-50 dark:bg-stone-800 rounded-2xl p-3 max-h-[180px] overflow-y-auto scrollbar-none border border-stone-100 dark:border-stone-700">
                            {capturedWindows.map((w) => (
                                <div key={w.id} className="flex items-center gap-2 py-1.5 border-b border-stone-100 dark:border-stone-700 last:border-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600" />
                                    <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 w-20 truncate">{w.app_name}</span>
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate flex-1">{w.title || 'Untitled'}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Name</label>
                            <input 
                                autoFocus
                                className="w-full bg-stone-50 dark:bg-stone-800 h-10 rounded-xl px-3 text-sm text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 transition-all font-medium"
                                value={captureName}
                                onChange={(e) => setCaptureName(e.target.value)}
                                placeholder="Workspace Name..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-1">
                            <button 
                                onClick={() => setPreviewMode(false)}
                                className="px-4 py-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors text-xs font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveConfirm}
                                disabled={isCapturing}
                                className="px-4 py-2 bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors text-xs font-medium flex items-center gap-1.5"
                            >
                                {isCapturing ? 'Saving...' : 'Save Snapshot'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Multi-Window Presets */}
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1 mb-2">Workspace Layouts</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handlePreset('columns_2')} className="h-14 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 hover:shadow-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-all flex items-center px-3 gap-3 text-stone-600 dark:text-stone-300">
                                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400">
                                    <Columns2 size={16} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold uppercase tracking-wide">2 Columns</span>
                                    <span className="text-[9px] text-stone-400 dark:text-stone-500">Horizontal</span>
                                </div>
                            </button>
                            <button onClick={() => handlePreset('rows_2')} className="h-14 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 hover:shadow-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-all flex items-center px-3 gap-3 text-stone-600 dark:text-stone-300">
                                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400">
                                    <Rows2 size={16} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold uppercase tracking-wide">2 Rows</span>
                                    <span className="text-[9px] text-stone-400 dark:text-stone-500">Vertical</span>
                                </div>
                            </button>
                            <button onClick={() => handlePreset('columns_3')} className="h-14 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 hover:shadow-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-all flex items-center px-3 gap-3 text-stone-600 dark:text-stone-300">
                                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400">
                                    <Columns3 size={16} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold uppercase tracking-wide">3 Columns</span>
                                    <span className="text-[9px] text-stone-400 dark:text-stone-500">Triple</span>
                                </div>
                            </button>
                            <button onClick={() => handlePreset('grid_4')} className="h-14 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 hover:shadow-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-all flex items-center px-3 gap-3 text-stone-600 dark:text-stone-300">
                                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400">
                                    <Grid2X2 size={16} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold uppercase tracking-wide">2x2 Grid</span>
                                    <span className="text-[9px] text-stone-400 dark:text-stone-500">Four</span>
                                </div>
                            </button>
                            <button onClick={() => handlePreset('main_left')} className="h-14 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 hover:shadow-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-all flex items-center px-3 gap-3 text-stone-600 dark:text-stone-300">
                                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400">
                                    <LayoutPanelLeft size={16} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold uppercase tracking-wide">Focus</span>
                                    <span className="text-[9px] text-stone-400 dark:text-stone-500">Main+Stack</span>
                                </div>
                            </button>
                            <button onClick={() => handlePreset('cascade')} className="h-14 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 hover:shadow-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-all flex items-center px-3 gap-3 text-stone-600 dark:text-stone-300">
                                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400">
                                    <LayersIcon size={16} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold uppercase tracking-wide">Cascade</span>
                                    <span className="text-[9px] text-stone-400 dark:text-stone-500">Staircase</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Snapshots</h3>
                        {layouts.map((layout) => (
                                                    <motion.div
                                                        key={layout.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all group relative overflow-hidden"
                                                    >                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-stone-50 dark:bg-stone-800 rounded-lg flex items-center justify-center text-stone-400">
                                            <Layout size={16} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-sm text-stone-700 dark:text-stone-200">{layout.name}</h3>
                                            <p className="text-[10px] text-stone-400">{layout.layout_data.length} windows • {new Date(layout.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => deleteLayout(layout.id)}
                                        className="p-1.5 text-stone-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <button 
                                    onClick={() => handleRestore(layout.layout_data)}
                                    className="w-full py-2 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl hover:bg-stone-800 dark:hover:bg-stone-700 hover:text-white dark:hover:text-stone-100 transition-all text-xs font-medium flex items-center justify-center gap-2 group/btn"
                                >
                                    <span>Restore Layout</span>
                                    <ArrowRight size={12} className="opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                </button>
                            </motion.div>
                        ))}

                        {layouts.length === 0 && (
                            <div className="text-center py-8 text-stone-400 flex flex-col items-center gap-3">
                                <Laptop size={40} className="opacity-20" strokeWidth={1} />
                                <p className="text-sm">No snapshots yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};