import { create } from "zustand";

interface UIState {
  sidebarVisible: boolean;
  activeView: "chat" | "clipboard" | "shortcuts" | "layouts" | "scraping" | "settings";
  theme: "light" | "dark" | "system";
  isHoveringEdge: boolean;
  setSidebarVisible: (visible: boolean) => void;
  setActiveView: (view: UIState["activeView"]) => void;
  setTheme: (theme: UIState["theme"]) => void;
  setHoveringEdge: (hovering: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarVisible: false,
  activeView: "chat",
  theme: "system",
  isHoveringEdge: false,
  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
  setActiveView: (view) => set({ activeView: view }),
  setTheme: (theme) => set({ theme }),
  setHoveringEdge: (hovering) => set({ isHoveringEdge: hovering }),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
}));
