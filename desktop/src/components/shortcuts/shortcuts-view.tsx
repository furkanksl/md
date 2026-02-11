import { useState, useEffect, useRef } from 'react';
import { readDir } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { Search, Plus, Play, Trash2, AppWindow, Loader2, X, Layers, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShortcutsStore } from '@/stores/shortcuts-store';
import { AppShortcut } from '@/types/shortcuts';
import { clsx } from 'clsx';

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
    <div className={`${className} bg-muted flex items-center justify-center text-muted-foreground`}>
      <AppWindow size={20} />
    </div>
  );
};

export const ShortcutsView = () => {
  const { apps, addApp, removeApp } = useShortcutsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detectedApps, setDetectedApps] = useState<AppShortcut[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  const handleAddApp = async (app: AppShortcut) => {
    await addApp(app);
    setIsModalOpen(false);
  };

  const launchApp = async (path: string) => {
    try {
      await invoke('launch_app', { path });
    } catch (err) {
      console.error("Failed to open app:", err);
    }
  };

  // Filter detected apps:
  // 1. Must match search query
  // 2. Must NOT be in the saved 'apps' list
  const filteredDetected = detectedApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isAlreadySaved = apps.some(saved => saved.path === app.path);
    return matchesSearch && !isAlreadySaved;
  });

  const visibleApps = filteredDetected.slice(0, visibleCount);

  return (
    <div className="h-full px-4 pt-1 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-light text-foreground">My Apps</h2>
          <div className="flex bg-muted rounded-md p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                "p-1.5 rounded-md transition-all",
                viewMode === 'grid'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                "p-1.5 rounded-md transition-all",
                viewMode === 'list'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={14} />
            </button>
          </div>
        </div>
        <button
          onClick={scanApplications}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={14} />
          <span>Add App</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 px-1 -mx-1 scrollbar-none min-h-0">
        {apps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4 opacity-50">
            <Layers size={40} strokeWidth={1} />
            <p className="text-sm">No apps pinned yet.</p>
          </div>
        ) : (
          <div className={clsx(
            viewMode === 'grid'
              ? "grid grid-cols-4 gap-4 p-2"
              : "grid grid-cols-1 gap-2"
          )}>
            {apps.map((app) => (
              <div
                key={app.id}
                onClick={() => launchApp(app.path)}
                className={clsx(
                  "group relative transition-all cursor-pointer",
                  viewMode === 'list'
                    ? "bg-card p-3 rounded-md border border-border shadow-sm hover:shadow-md hover:scale-[1.01] flex items-center justify-between"
                    : "aspect-square flex items-center justify-center rounded-md hover:bg-muted"
                )}
                title={app.name}
              >
                <div className={clsx("flex items-center min-w-0", viewMode === 'list' ? "gap-3" : "justify-center w-full h-full")}>
                  <AppIcon
                    path={app.path}
                    className={clsx(
                      "object-contain shrink-0 transition-transform group-hover:scale-110",
                      viewMode === 'list' ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-md drop-shadow-sm"
                    )}
                  />
                  {viewMode === 'list' && (
                    <span className="font-medium text-sm text-foreground truncate">{app.name}</span>
                  )}
                </div>

                {/* Actions */}
                <div className={clsx(
                  "flex items-center gap-1 transition-opacity",
                  viewMode === 'list'
                    ? "opacity-0 group-hover:opacity-100"
                    : "absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 scale-90"
                )}>
                  {viewMode === 'grid' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeApp(app.id); }}
                      className="p-1 bg-card rounded-full shadow-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeApp(app.id); }}
                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="p-1.5 bg-muted rounded-md text-muted-foreground group-hover:text-foreground">
                        <Play size={14} fill="currentColor" />
                      </div>
                    </>
                  )}
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
            className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col p-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  autoFocus
                  className="w-full bg-input h-9 rounded-lg pl-9 pr-3 text-sm focus:outline-none border border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="Search /Applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none min-h-0">
              <div className="space-y-1 pb-4">
                {isLoadingApps ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-xs">Scanning Applications...</span>
                  </div>
                ) : (
                  <>
                    {visibleApps.map((app) => (
                      <button
                        key={app.path}
                        onClick={() => handleAddApp(app)}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-card hover:shadow-sm rounded-lg transition-all text-left group border border-transparent hover:border-border"
                      >
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                          <AppWindow size={16} />
                        </div>
                        <span className="text-xs font-medium text-foreground flex-1 truncate">{app.name}</span>
                        <Plus size={14} className="text-muted-foreground/50 group-hover:text-foreground" />
                      </button>))}
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