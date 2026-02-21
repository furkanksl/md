import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { SettingsRepository } from "@/core/infra/repositories";
import { normalizeUrl } from "@/lib/url";
import { v4 as uuidv4 } from "uuid";
import { historyService, HistoryFilter, WebHistoryEntry } from "@/core/application/services/history-service";

const settingsRepo = new SettingsRepository();

export type WebBlanketFavorite = {
  id: string;
  title: string;
  url: string;
  iconUrl?: string;
  createdAt: number;
  updatedAt: number;
};

export type WebBlanketTab = {
  id: string;
  url: string;
  title?: string;
  pinned?: boolean;
  createdAt: number;
  lastActiveAt: number;
  loading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  zoom?: number;
  userAgent?: "mobile" | "desktop";
  muted?: boolean;
  lastHistoryUrl?: string; // Track last URL added to history
};

interface WebBlanketState {
  // State
  mode: "research" | "browse";
  enabled: boolean;
  favorites: WebBlanketFavorite[];
  tabs: WebBlanketTab[];
  activeTabId: string | null;
  urlBarVisible: boolean;
  hoveringBrowseRegion: boolean;
  shouldFocusUrlBar: boolean;
  isFullScreen: boolean;
  isHistoryOpen: boolean;

  isSuggestionsOpen: boolean;
  // Actions
  init: () => Promise<void>;
  dispose: () => void;
  setMode: (mode: "research" | "browse") => Promise<void>;
  setHoveringBrowseRegion: (hovering: boolean) => void;
  setUrlBarVisible: (visible: boolean) => void;
  setShouldFocusUrlBar: (focus: boolean) => void;
  setFullScreen: (isFullScreen: boolean) => void;
  setIsHistoryOpen: (isHistoryOpen: boolean) => void;
  setIsSuggestionsOpen: (isSuggestionsOpen: boolean) => void;
  // Tab Management
  createTab: (url?: string) => Promise<string>;
  activateTab: (tabId: string) => Promise<void>;
  closeTab: (tabId: string) => Promise<void>;
  updateTab: (tabId: string, updates: Partial<WebBlanketTab>) => void; // local update
  
  // Navigation
  navigate: (tabId: string, url: string) => Promise<void>;
  syncTabState: (tabId: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  reload: () => Promise<void>;
  stop: () => Promise<void>;
  reloadTab: (tabId: string) => Promise<void>;
  zoomIn: () => Promise<void>;
  zoomOut: () => Promise<void>;
  toggleUserAgent: (tabId: string) => Promise<void>;
  setTabMuted: (tabId: string, muted: boolean) => Promise<void>;

  // Favorites
  addFavorite: (title: string, url: string) => Promise<void>;
  updateFavorite: (id: string, title: string, url: string) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  reorderFavorites: (favorites: WebBlanketFavorite[]) => Promise<void>;

  // History
  getHistory: (filter: HistoryFilter) => Promise<WebHistoryEntry[]>;
  searchHistory: (query: string) => Promise<WebHistoryEntry[]>;
  clearHistory: () => Promise<void>;
}

const createDefaultFavorites = (): WebBlanketFavorite[] => [
  { id: uuidv4(), title: "Google", url: "https://google.com", createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), title: "YouTube", url: "https://youtube.com", createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), title: "GitHub", url: "https://github.com/furkanksl/md", createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), title: "X", url: "https://x.com", createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), title: "Instagram", url: "https://instagram.com", createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), title: "WhatsApp", url: "https://web.whatsapp.com", createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), title: "Telegram", url: "https://web.telegram.org", createdAt: Date.now(), updatedAt: Date.now() },
  { id: uuidv4(), title: "My Drawer", url: "https://mydrawer.furkanksl.com", createdAt: Date.now(), updatedAt: Date.now() },
];

let isInitialized = false;
let initPromise: Promise<void> | null = null;
let unlistenFns: Array<() => void> = [];

export const useWebBlanketStore = create<WebBlanketState>((set, get) => ({
  mode: "browse",
  enabled: false,
  favorites: [],
  tabs: [],
  activeTabId: null,
  urlBarVisible: false,
  hoveringBrowseRegion: false,
  shouldFocusUrlBar: false,
  isFullScreen: false,
  isHistoryOpen: false,
  isSuggestionsOpen: false,

  dispose: () => {
    unlistenFns.forEach((unlisten) => {
      try {
        unlisten();
      } catch (e) {
        console.warn("Failed to unlisten web blanket listener:", e);
      }
    });
    unlistenFns = [];
    isInitialized = false;
    initPromise = null;
  },

  setFullScreen: (isFullScreen) => set({ isFullScreen }),

  setIsHistoryOpen: (isHistoryOpen: boolean) => set({ isHistoryOpen }),
  
  setIsSuggestionsOpen: (isSuggestionsOpen: boolean) => set({ isSuggestionsOpen }),
 
  init: async () => {
    if (isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        // Listen for new window events from Rust
        try {
          const unlisten = await listen<{ url: string }>("web-blanket-new-window", (event) => {
            console.log("New window requested:", event.payload.url);
            get().createTab(event.payload.url);
          });
          unlistenFns.push(unlisten);
        } catch (e) {
          console.error("Failed to setup new window listener", e);
        }

        // Listen for menu shortcuts
        try {
          const unlisten = await listen("web-blanket-new-tab", () => {
            get().createTab();
          });
          unlistenFns.push(unlisten);
        } catch (e) {
          console.error("Failed to setup new tab listener", e);
        }

        try {
          const unlisten = await listen("web-blanket-close-tab", () => {
            const { activeTabId, closeTab } = get();
            if (activeTabId) {
              closeTab(activeTabId);
            }
          });
          unlistenFns.push(unlisten);
        } catch (e) {
          console.error("Failed to setup close tab listener", e);
        }

        try {
          const unlisten = await listen("web-blanket-focus-url", () => {
            get().setShouldFocusUrlBar(true);
          });
          unlistenFns.push(unlisten);
        } catch (e) {
          console.error("Failed to setup focus url listener", e);
        }

        try {
          const unlisten = await listen<{ index: number | "last" }>("web-blanket-switch-tab", (event) => {
            const { tabs, activateTab } = get();
            if (tabs.length === 0) return;

            if (event.payload.index === "last") {
              const lastTab = tabs[tabs.length - 1];
              if (lastTab) activateTab(lastTab.id);
            } else {
              const tab = tabs[event.payload.index];
              if (tab) activateTab(tab.id);
            }
          });
          unlistenFns.push(unlisten);
        } catch (e) {
          console.error("Failed to setup switch tab listener", e);
        }

        const [
          enabled,
          favorites,
          tabs,
          activeTabId
        ] = await Promise.all([
          settingsRepo.get<boolean>("web_blanket_enabled"),
          settingsRepo.get<WebBlanketFavorite[]>("web_blanket_favorites"),
          settingsRepo.get<WebBlanketTab[]>("web_blanket_tabs"),
          settingsRepo.get<string>("web_blanket_active_tab_id"),
        ]);

        let initialFavorites = favorites;
        if (!initialFavorites) {
          initialFavorites = createDefaultFavorites();
          await settingsRepo.set("web_blanket_favorites", initialFavorites);
        }

        set({
          enabled: enabled ?? false,
          favorites: initialFavorites || [],
          tabs: tabs || [],
          activeTabId: activeTabId || null,
        });

        // Restore native session if enabled
        if (enabled && tabs && tabs.length > 0) {
          try {
            await Promise.all(tabs.map(t =>
              invoke("web_blanket_tab_create", { tabId: t.id, url: t.url })
                .catch(e => console.error("Failed to restore tab:", t.id, e))
            ));

            if (activeTabId) {
              await invoke("web_blanket_tab_activate", { tabId: activeTabId })
                .catch(e => console.error("Failed to activate tab:", activeTabId, e));
            }
          } catch (e) {
            console.error("Failed to restore native session:", e);
          }
        }

        isInitialized = true;
      } catch (e) {
        console.error("Failed to load Web Blanket settings:", e);
        unlistenFns.forEach((unlisten) => {
          try {
            unlisten();
          } catch (err) {
            console.warn("Failed to unlisten web blanket listener after init error:", err);
          }
        });
        unlistenFns = [];
        isInitialized = false;
        throw e;
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  },

  setMode: async (mode) => {
    const isBrowse = mode === "browse";
    set({ mode, enabled: isBrowse });
    await settingsRepo.set("web_blanket_enabled", isBrowse);
     
    if (isBrowse) { 
      const { tabs } = get();
      if (tabs.length > 0) {
         // We'll optimistically try to create them. If they exist, we might get duplicates in UI.
         // Let's rely on a flag.
      }
    } else {
      try {
        await invoke("web_blanket_hide");
      } catch (e) {
        console.warn("Native blanket hide failed (might not be implemented yet):", e);
      }
    }
  },

  setHoveringBrowseRegion: (hovering) => {
    set({ hoveringBrowseRegion: hovering });
    // If hovering, show URL bar. If not, maybe hide after delay (handled by component)
  },

  setUrlBarVisible: (visible) => set({ urlBarVisible: visible }),

  setShouldFocusUrlBar: (focus) => set({ shouldFocusUrlBar: focus }),

  createTab: async (urlInput) => {
    let url = "";
    if (urlInput) {
        const normalized = normalizeUrl(urlInput);
        if (normalized.ok) {
            url = normalized.url;
        }
    }

    // Focus URL bar if creating an empty tab
    if (!url) {
        set({ shouldFocusUrlBar: true });
    }

    const id = uuidv4();
    let userAgent: "mobile" | "desktop" = "mobile";
    if (url.includes("web.whatsapp.com")) {
        userAgent = "desktop";
    }

    const newTab: WebBlanketTab = {
      id,
      url,
      title: "New Tab",
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      loading: false,
      userAgent,
    };
    
    const { tabs } = get();
    const newTabs = [...tabs, newTab];
    
    set({ tabs: newTabs, activeTabId: id });
    await settingsRepo.set("web_blanket_tabs", newTabs);
    await settingsRepo.set("web_blanket_active_tab_id", id);
    
    try {
      await invoke("web_blanket_tab_create", { tabId: id, url: url || null });
      await invoke("web_blanket_tab_activate", { tabId: id });
      
      if (userAgent === "desktop") {
         await invoke("web_blanket_set_user_agent", { tabId: id, mode: "desktop" });
      }
    } catch (e) {
       console.warn("Native tab create failed:", e);
    }
    
    return id;
  },

  activateTab: async (tabId) => {
    const { tabs } = get();
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const updatedTabs = tabs.map(t => 
        t.id === tabId ? { ...t, lastActiveAt: Date.now() } : t
    );
    
    set({ activeTabId: tabId, tabs: updatedTabs });
    await settingsRepo.set("web_blanket_active_tab_id", tabId);
    await settingsRepo.set("web_blanket_tabs", updatedTabs);

    try {
      await invoke("web_blanket_tab_activate", { tabId });
    } catch (e) {
      console.warn("Native tab activate failed:", e);
    }
  },

  closeTab: async (tabId) => {
    const { tabs } = get();
    const activeTabId = get().activeTabId;
    const newTabs = tabs.filter(t => t.id !== tabId);
    
    let newActiveId = activeTabId;
    if (activeTabId === tabId) {
        // If closing active tab, activate the one before it, or after it, or null
        if (newTabs.length > 0) {
            const nextTab = newTabs[newTabs.length - 1];
            newActiveId = nextTab ? nextTab.id : null;
        } else {
            newActiveId = null;
        }
    }

    set({ tabs: newTabs, activeTabId: newActiveId });
    await settingsRepo.set("web_blanket_tabs", newTabs);
    await settingsRepo.set("web_blanket_active_tab_id", newActiveId);

    try {
      await invoke("web_blanket_tab_close", { tabId });
      if (newActiveId) {
          await invoke("web_blanket_tab_activate", { tabId: newActiveId });
      }
    } catch (e) {
        console.warn("Native tab close/activate failed:", e);
    }
  },

  updateTab: (tabId, updates) => {
    const { tabs } = get();
    const newTabs = tabs.map(t => t.id === tabId ? { ...t, ...updates } : t);
    set({ tabs: newTabs });
    // We don't necessarily persist on every minor update (like loading state), 
    // but we should for URL/Title changes.
    if (updates.url || updates.title) {
         settingsRepo.set("web_blanket_tabs", newTabs);
    }
  },

  navigate: async (tabId, urlInput) => {
    const { ok, url } = normalizeUrl(urlInput);
    if (!ok) return;

    if (url.includes("web.whatsapp.com")) {
        get().updateTab(tabId, { userAgent: "desktop" });
        try {
            await invoke("web_blanket_set_user_agent", { tabId, mode: "desktop" });
        } catch(e) { console.error("Failed to set UA for WhatsApp:", e); }
    }

    // Optimistic update
    get().updateTab(tabId, { url, loading: true });
    
    try {
      await invoke("web_blanket_navigate", { tabId, url });
    } catch (e) {
      console.warn("Native navigate failed:", e);
      get().updateTab(tabId, { loading: false });
    }
  },

  syncTabState: async (tabId) => {
      try {
          const state = await invoke<any>("web_blanket_get_tab_state", { tabId });
          
          const updates: Partial<WebBlanketTab> = {
              title: state.title || "New Tab",
              loading: state.loading,
              canGoBack: state.can_go_back,
              canGoForward: state.can_go_forward,
              zoom: state.current_zoom
          };
          
          if (state.url && state.url.trim() !== "") {
              updates.url = state.url;
          }
          
          const { tabs, updateTab } = get();
          updateTab(tabId, updates);

          // History Logic
          const currentTab = tabs.find(t => t.id === tabId);
          // Only add to history if:
          // 1. Not loading
          // 2. URL is valid and not about:blank
          // 3. URL is different from last added history URL
          if (!state.loading && state.url && state.url !== "about:blank" && currentTab && currentTab.lastHistoryUrl !== state.url) {
              updateTab(tabId, { lastHistoryUrl: state.url });
              historyService.addEntry(state.url, state.title || state.url);
          }

      } catch (e) {
          // Tab might not exist native side or other error
      }
  },

  goBack: async () => {
      try { await invoke("web_blanket_go_back"); } catch (e) {}
  },
  
  goForward: async () => {
      try { await invoke("web_blanket_go_forward"); } catch (e) {}
  },
  
  reload: async () => {
      try { await invoke("web_blanket_reload"); } catch (e) {}
  },
  
  stop: async () => {
      try { await invoke("web_blanket_stop_loading"); } catch (e) {}
  },

  reloadTab: async (tabId) => {
      try { await invoke("web_blanket_reload_tab", { tabId }); } catch (e) {}
  },

  zoomIn: async () => {
      const { activeTabId, tabs } = get();
      if (!activeTabId) return;
      const tab = tabs.find(t => t.id === activeTabId);
      if (tab) {
          const newZoom = (tab.zoom || 1) + 0.1;
          get().updateTab(activeTabId, { zoom: newZoom });
          try { await invoke("web_blanket_zoom_in"); } catch (e) {}
      }
  },

  zoomOut: async () => {
      const { activeTabId, tabs } = get();
      if (!activeTabId) return;
      const tab = tabs.find(t => t.id === activeTabId);
      if (tab) {
          const newZoom = Math.max(0.5, (tab.zoom || 1) - 0.1);
          get().updateTab(activeTabId, { zoom: newZoom });
          try { await invoke("web_blanket_zoom_out"); } catch (e) {}
      }
  },

  addFavorite: async (title, url) => {
      const { favorites } = get();
      const newFav: WebBlanketFavorite = {
          id: uuidv4(),
          title,
          url,
          createdAt: Date.now(),
          updatedAt: Date.now()
      };
      const newFavs = [...favorites, newFav];
      set({ favorites: newFavs });
      await settingsRepo.set("web_blanket_favorites", newFavs);
  },

  updateFavorite: async (id, title, url) => {
      const { favorites } = get();
      const newFavs = favorites.map(f => 
          f.id === id ? { ...f, title, url, updatedAt: Date.now() } : f
      );
      set({ favorites: newFavs });
      await settingsRepo.set("web_blanket_favorites", newFavs);
  },

  removeFavorite: async (id) => {
      const { favorites } = get();
      const newFavs = favorites.filter(f => f.id !== id);
      set({ favorites: newFavs });
      await settingsRepo.set("web_blanket_favorites", newFavs);
  },

  reorderFavorites: async (newFavorites) => {
      set({ favorites: newFavorites });
      await settingsRepo.set("web_blanket_favorites", newFavorites);
  },

  toggleUserAgent: async (tabId) => {
      const { tabs } = get();
      const tab = tabs.find(t => t.id === tabId);
      if (tab) {
          const newUserAgent = tab.userAgent === "desktop" ? "mobile" : "desktop";
          get().updateTab(tabId, { userAgent: newUserAgent });
          try {
              await invoke("web_blanket_set_user_agent", { tabId, mode: newUserAgent });
          } catch (e) { console.error(e); }
      }
  },

  setTabMuted: async (tabId, muted) => {
      get().updateTab(tabId, { muted });
      try { await invoke("web_blanket_set_muted", { tabId, muted }); } catch (e) {}
  },

  getHistory: async (filter) => {
      return await historyService.getHistory(filter);
  },

  searchHistory: async (query) => {
      return await historyService.search(query);
  },

  clearHistory: async () => {
      await historyService.clearHistory();
  }
}));
