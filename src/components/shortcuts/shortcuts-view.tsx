import { useState, useEffect, useRef } from 'react';
import { readDir } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { Search, Plus, Play, Trash2, AppWindow, Loader2, X, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AppShortcut {
  id: string;
  name: string;
  path: string;
  icon?: string;
}

// Icon Component to fetch and display app icon
const AppIcon = ({ path, className }: { path: string, className?: string }) => {
    const [iconSrc, setIconSrc] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const fetchIcon = async () => {
            try {
                const src = await invoke<string>('get_app_icon', { path });
                if (active) setIconSrc(src);
            } catch (err) {
                console.error("Failed to load icon:", err);
            }
        };
        fetchIcon();
        return () => { active = false; };
    }, [path]);

    if (iconSrc) {
        return <img src={iconSrc} alt="App Icon" className={className} />;
    }

    return (
        <div className={`${className} bg-stone-100 flex items-center justify-center text-stone-400`}>
            <AppWindow size={20} />
        </div>
    );
};

export const ShortcutsView = () => {
  const [apps, setApps] = useState<AppShortcut[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detectedApps, setDetectedApps] = useState<AppShortcut[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('my-drawer-apps');
    if (saved) {
      setApps(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('my-drawer-apps', JSON.stringify(apps));
  }, [apps]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!isModalOpen) return;
    
    const observer = new IntersectionObserver((entries) => {
        if (entries[0] && entries[0].isIntersecting) {
            setVisibleCount(prev => prev + 10);
        }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [isModalOpen, detectedApps, searchQuery]);

  const scanApplications = async () => {
    setIsLoadingApps(true);
    setIsModalOpen(true);
    setVisibleCount(10); // Reset visible count
    try {
      // Scan both user and system applications
      const userApps = await readDir('/Applications').then(entries => entries.map(e => ({ ...e, basePath: '/Applications' }))).catch(() => []);
      const systemApps = await readDir('/System/Applications').then(entries => entries.map(e => ({ ...e, basePath: '/System/Applications' }))).catch(() => []);
      
      const allEntries = [...userApps, ...systemApps];
      
      const foundApps = allEntries
        .filter(entry => entry.name.endsWith('.app'))
        .map(entry => {
            return {
                id: entry.name,
                name: entry.name.replace('.app', ''),
                path: `${entry.basePath}/${entry.name}`,
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      // Remove duplicates by name
      const uniqueApps = Array.from(new Map(foundApps.map(item => [item.name, item])).values());

      setDetectedApps(uniqueApps);
    } catch (error) {
      console.error("Failed to scan apps:", error);
      setDetectedApps([]);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const addApp = (app: AppShortcut) => {
    if (!apps.find(a => a.path === app.path)) {
      setApps([...apps, app]);
    }
    setIsModalOpen(false);
  };

  const removeApp = (id: string) => {
    setApps(apps.filter(a => a.id !== id));
  };

  const launchApp = async (path: string) => {
    try {
      await invoke('launch_app', { path });
    } catch (err) {
      console.error("Failed to open app:", err);
    }
  };

  const filteredDetected = detectedApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleApps = filteredDetected.slice(0, visibleCount);

  return (
    <div className="h-full px-6 py-4 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-2xl font-light text-stone-800">My Apps</h2>
        <button 
          onClick={scanApplications}
          className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-700 transition-colors shadow-lg shadow-stone-200/50"
        >
          <Plus size={16} />
          <span>Add App</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 scrollbar-none min-h-0">
        {apps.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <Layers size={48} className="mx-auto mb-4 opacity-20" />
            <p>No apps pinned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {apps.map((app) => (
                <div 
                key={app.id}
                onClick={() => launchApp(app.path)}
                className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group flex items-center justify-between"
                >
                <div className="flex items-center gap-4 min-w-0">
                    <AppIcon path={app.path} className="w-12 h-12 rounded-xl object-contain shrink-0" />
                    <span className="font-medium text-stone-700 truncate">{app.name}</span>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                    onClick={(e) => { e.stopPropagation(); removeApp(app.id); }}
                    className="p-2 hover:bg-red-50 text-stone-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                    <Trash2 size={16} />
                    </button>
                    <div className="p-2 bg-stone-50 rounded-lg text-stone-400 group-hover:text-stone-800">
                    <Play size={16} fill="currentColor" />
                    </div>
                </div>
                </div>
            ))}
          </div>
        )}
      </div>

      {/* Add App Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-stone-50/95 backdrop-blur-sm z-50 flex flex-col p-6 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-stone-200 rounded-full transition-colors"
              >
                <X size={20} className="text-stone-600" />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  autoFocus
                  className="w-full bg-white h-10 rounded-xl pl-10 pr-4 text-sm focus:outline-none border border-stone-200"
                  placeholder="Search /Applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none min-h-0">
                <div className="space-y-2 pb-4">
                    {isLoadingApps ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-stone-400">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-sm">Scanning Applications...</span>
                        </div>
                    ) : (
                        <>
                            {visibleApps.map((app) => (
                                                        <button
                                                            key={app.path}
                                                            onClick={() => addApp(app)}
                                                            className="w-full flex items-center gap-3 p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-left group border border-transparent hover:border-stone-100"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                                                                <AppWindow size={18} />
                                                            </div>
                                                            <span className="text-sm font-medium text-stone-700 flex-1 truncate">{app.name}</span>
                                                            <Plus size={16} className="text-stone-300 group-hover:text-stone-600" />
                                                        </button>                            ))}
                            {/* Sentinel for Infinite Scroll */}
                            <div ref={loadMoreRef} className="h-4" />
                        </>
                    )}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};