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
    <div className="h-full px-6 py-4 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-2xl font-light text-stone-800">Window Flow</h2>
        {!previewMode && (
            <button 
            onClick={handleCaptureStart}
            className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-700 transition-colors shadow-lg shadow-stone-200/50"
            >
            <Plus size={16} />
            <span>Capture</span>
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-8 scrollbar-none min-h-0">
        <AnimatePresence mode="wait">
            {previewMode ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xl shadow-stone-200/50"
                >
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-stone-500 mb-2">
                            <Monitor size={20} />
                            <span className="text-sm font-medium">{capturedWindows.length} windows detected</span>
                        </div>

                        <div className="bg-stone-50 rounded-2xl p-4 max-h-[200px] overflow-y-auto scrollbar-none border border-stone-100">
                            {capturedWindows.map((w) => (
                                <div key={w.id} className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0">
                                    <div className="w-2 h-2 rounded-full bg-stone-300" />
                                    <span className="text-xs font-bold text-stone-600 w-24 truncate">{w.app_name}</span>
                                    <span className="text-xs text-stone-400 truncate flex-1">{w.title || 'Untitled'}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Name</label>
                            <input 
                                autoFocus
                                className="w-full bg-stone-50 h-12 rounded-xl px-4 text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-100 transition-all font-medium"
                                value={captureName}
                                onChange={(e) => setCaptureName(e.target.value)}
                                placeholder="Workspace Name..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-2">
                            <button 
                                onClick={() => setPreviewMode(false)}
                                className="px-6 py-2.5 text-stone-500 hover:bg-stone-100 rounded-xl transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveConfirm}
                                disabled={isCapturing}
                                className="px-6 py-2.5 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                {isCapturing ? 'Saving...' : 'Save Snapshot'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-8">
                    {/* Multi-Window Presets */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1 mb-3">Workspace Layouts</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handlePreset('columns_2')} className="h-16 bg-white rounded-2xl border border-stone-100 hover:shadow-md hover:bg-stone-50 transition-all flex items-center px-4 gap-4 text-stone-600">
                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                                    <Columns2 size={20} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-bold uppercase tracking-wide">2 Columns</span>
                                    <span className="text-[10px] text-stone-400">Horizontal Split</span>
                                </div>
                            </button>
                            <button onClick={() => handlePreset('rows_2')} className="h-16 bg-white rounded-2xl border border-stone-100 hover:shadow-md hover:bg-stone-50 transition-all flex items-center px-4 gap-4 text-stone-600">
                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                                    <Rows2 size={20} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-bold uppercase tracking-wide">2 Rows</span>
                                    <span className="text-[10px] text-stone-400">Vertical Split</span>
                                </div>
                            </button>
                            <button onClick={() => handlePreset('columns_3')} className="h-16 bg-white rounded-2xl border border-stone-100 hover:shadow-md hover:bg-stone-50 transition-all flex items-center px-4 gap-4 text-stone-600">
                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                                    <Columns3 size={20} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-bold uppercase tracking-wide">3 Columns</span>
                                    <span className="text-[10px] text-stone-400">Triple Split</span>
                                </div>
                            </button>
                            <button onClick={() => handlePreset('grid_4')} className="h-16 bg-white rounded-2xl border border-stone-100 hover:shadow-md hover:bg-stone-50 transition-all flex items-center px-4 gap-4 text-stone-600">
                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                                    <Grid2X2 size={20} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-bold uppercase tracking-wide">2x2 Grid</span>
                                    <span className="text-[10px] text-stone-400">Four Windows</span>
                                </div>
                            </button>
                            <button onClick={() => handlePreset('main_left')} className="h-16 bg-white rounded-2xl border border-stone-100 hover:shadow-md hover:bg-stone-50 transition-all flex items-center px-4 gap-4 text-stone-600">
                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                                    <LayoutPanelLeft size={20} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-bold uppercase tracking-wide">Focus Mode</span>
                                    <span className="text-[10px] text-stone-400">Main + Stack</span>
                                </div>
                            </button>
                            <button onClick={() => handlePreset('cascade')} className="h-16 bg-white rounded-2xl border border-stone-100 hover:shadow-md hover:bg-stone-50 transition-all flex items-center px-4 gap-4 text-stone-600">
                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                                    <LayersIcon size={20} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-bold uppercase tracking-wide">Cascade</span>
                                    <span className="text-[10px] text-stone-400">Staircase View</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 ml-1">Snapshots</h3>
                        {layouts.map((layout) => (
                                                    <motion.div
                                                        key={layout.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all group relative overflow-hidden"
                                                    >                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400">
                                            <Layout size={20} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-stone-700">{layout.name}</h3>
                                            <p className="text-xs text-stone-400">{layout.layout_data.length} windows • {new Date(layout.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => deleteLayout(layout.id)}
                                        className="p-2 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <button 
                                    onClick={() => handleRestore(layout.layout_data)}
                                    className="w-full py-2.5 bg-stone-50 text-stone-600 rounded-xl hover:bg-stone-800 hover:text-white transition-all text-sm font-medium flex items-center justify-center gap-2 group/btn"
                                >
                                    <span>Restore Layout</span>
                                    <ArrowRight size={14} className="opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                </button>
                            </motion.div>
                        ))}

                        {layouts.length === 0 && (
                            <div className="text-center py-8 text-stone-400 flex flex-col items-center gap-4">
                                <Laptop size={48} className="opacity-20" strokeWidth={1} />
                                <p>No snapshots yet.</p>
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