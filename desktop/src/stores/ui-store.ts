import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarVisible: boolean;
  activeView: "chat" | "clipboard" | "shortcuts" | "layouts" | "scraping" | "settings" | "tasks" | "about";
  theme: "light" | "dark";
  themeName: string;
  isHoveringEdge: boolean;
  setSidebarVisible: (visible: boolean) => void;
  setActiveView: (view: UIState["activeView"]) => void;
  setTheme: (theme: UIState["theme"]) => void;
  setThemeName: (themeName: string) => void;
  setHoveringEdge: (hovering: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarVisible: false,
      activeView: "chat",
      theme: "light",
      themeName: "MD",
      isHoveringEdge: false,
      setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
      setActiveView: (view) => set({ activeView: view }),
      setTheme: (theme) => set({ theme }),
      setThemeName: (themeName) => set({ themeName }),
      setHoveringEdge: (hovering) => set({ isHoveringEdge: hovering }),
      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
    }),
    {
      name: "ui-storage",
    }
  )
);
