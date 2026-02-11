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
} from 'lucide-react'; import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="h-full px-4 pt-1 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-xl font-light text-foreground">Window Flow</h2>
                {!previewMode && (
                    <button
                        onClick={handleCaptureStart}
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-colors shadow-lg shadow-primary/20"
                    >
                        <Plus size={14} />
                        <span>Capture</span>
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pb-4 px-1 -mx-1 scrollbar-none min-h-0">
                <AnimatePresence mode="wait">
                    {previewMode ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-card p-4 rounded-md border border-border shadow-xl"
                        >
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Monitor size={16} />
                                    <span className="text-xs font-medium">{capturedWindows.length} windows detected</span>
                                </div>

                                <div className="bg-muted/30 rounded-md p-3 max-h-[180px] overflow-y-auto scrollbar-none border border-border">
                                    {capturedWindows.map((w) => (
                                        <div key={w.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                                            <span className="text-[10px] font-bold text-foreground w-20 truncate">{w.app_name}</span>
                                            <span className="text-[10px] text-muted-foreground truncate flex-1">{w.title || 'Untitled'}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Name</label>
                                    <input
                                        autoFocus
                                        className="w-full bg-input h-10 rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all font-medium"
                                        value={captureName}
                                        onChange={(e) => setCaptureName(e.target.value)}
                                        placeholder="Workspace Name..."
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-1">
                                    <button
                                        onClick={() => setPreviewMode(false)}
                                        className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors text-xs font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveConfirm}
                                        disabled={isCapturing}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors text-xs font-medium flex items-center gap-1.5"
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
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-2">Workspace Layouts</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handlePreset('columns_2')} className="h-14 bg-card rounded-lg border border-border hover:shadow-md hover:bg-muted/50 transition-all flex items-center px-3 gap-3 text-foreground">
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                            <Columns2 size={16} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-bold uppercase tracking-wide">2 Columns</span>
                                            <span className="text-[9px] text-muted-foreground">Horizontal</span>
                                        </div>
                                    </button>
                                    <button onClick={() => handlePreset('rows_2')} className="h-14 bg-card rounded-lg border border-border hover:shadow-md hover:bg-muted/50 transition-all flex items-center px-3 gap-3 text-foreground">
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                            <Rows2 size={16} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-bold uppercase tracking-wide">2 Rows</span>
                                            <span className="text-[9px] text-muted-foreground">Vertical</span>
                                        </div>
                                    </button>
                                    <button onClick={() => handlePreset('columns_3')} className="h-14 bg-card rounded-lg border border-border hover:shadow-md hover:bg-muted/50 transition-all flex items-center px-3 gap-3 text-foreground">
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                            <Columns3 size={16} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-bold uppercase tracking-wide">3 Columns</span>
                                            <span className="text-[9px] text-muted-foreground">Triple</span>
                                        </div>
                                    </button>
                                    <button onClick={() => handlePreset('grid_4')} className="h-14 bg-card rounded-lg border border-border hover:shadow-md hover:bg-muted/50 transition-all flex items-center px-3 gap-3 text-foreground">
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                            <Grid2X2 size={16} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-bold uppercase tracking-wide">2x2 Grid</span>
                                            <span className="text-[9px] text-muted-foreground">Four</span>
                                        </div>
                                    </button>
                                    <button onClick={() => handlePreset('main_left')} className="h-14 bg-card rounded-lg border border-border hover:shadow-md hover:bg-muted/50 transition-all flex items-center px-3 gap-3 text-foreground">
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                            <LayoutPanelLeft size={16} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Focus</span>
                                            <span className="text-[9px] text-muted-foreground">Main+Stack</span>
                                        </div>
                                    </button>
                                    <button onClick={() => handlePreset('cascade')} className="h-14 bg-card rounded-lg border border-border hover:shadow-md hover:bg-muted/50 transition-all flex items-center px-3 gap-3 text-foreground">
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                            <LayersIcon size={16} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Cascade</span>
                                            <span className="text-[9px] text-muted-foreground">Staircase</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Snapshots</h3>
                                {layouts.map((layout) => (
                                    <div
                                        key={layout.id}
                                        className="bg-card p-4 rounded-md border border-border shadow-sm hover:shadow-md hover:scale-[1.01] transition-all group relative overflow-hidden"
                                    >                                <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                                    <Layout size={16} strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-sm text-foreground">{layout.name}</h3>
                                                    <p className="text-[10px] text-muted-foreground">{layout.layout_data.length} windows • {new Date(layout.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => deleteLayout(layout.id)}
                                                className="p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleRestore(layout.layout_data)}
                                            className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-primary hover:text-primary-foreground transition-all text-xs font-medium flex items-center justify-center gap-2 group/btn"
                                        >
                                            <span>Restore Layout</span>
                                            <ArrowRight size={12} className="opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                        </button>
                                    </div>
                                ))}

                                {layouts.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-3">
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