import { useUIStore } from "@/stores/ui-store";
import {
  MessageCircleDashed,
  Clipboard,
  Layout,
  Layers,
  Globe,
  Command,
} from "lucide-react";
import { clsx } from "clsx";
import { ChatView } from "./ai/chat-view";
import { ClipboardView } from "./clipboard/clipboard-view";
import { ShortcutsView } from "./shortcuts/shortcuts-view";
import { LayoutsView } from "./layouts/layouts-view";
import { ScrapingView } from "./scraping/scraping-view";
import { SettingsView } from "./settings/settings-view";
import { CustomTitlebar } from "./shared/custom-titlebar";
import { motion, AnimatePresence } from "framer-motion";

export const MainLayout = () => {
  const { activeView, setActiveView } = useUIStore();

  const navItems = [
    {
      id: "chat",
      icon: MessageCircleDashed,
      label: "Chat",
      color: "bg-yellow-100",
    },
    { id: "clipboard", icon: Clipboard, label: "Clip", color: "bg-orange-100" },
    { id: "shortcuts", icon: Layers, label: "Apps", color: "bg-pink-100" },
    { id: "layouts", icon: Layout, label: "Grid", color: "bg-green-100" },
    { id: "scraping", icon: Globe, label: "Web", color: "bg-blue-100" },
  ] as const;

  return (
    // Base: Cleaner Canvas
    <div className="flex flex-col h-screen w-screen bg-[#fafafa] font-sans">
      {/* Main Container */}
      <div className="flex-1 flex flex-col bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden relative">
        {/* Header - Now strictly the drag region */}
        <header
          data-tauri-drag-region
          className="shrink-0 h-14 flex items-center justify-between px-5 border-b-2 border-zinc-100 bg-white z-20 select-none"
        >
          <div className="flex items-center gap-2.5 pointer-events-none">
            {" "}
            {/* Prevent text selection/interaction on title */}
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
              <Command size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">
              Drawer
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Settings Toggle Button */}
            <button
              onClick={() =>
                setActiveView(activeView === "settings" ? "chat" : "settings")
              }
              className={clsx(
                "p-2 rounded-lg transition-all active:translate-y-[1px]",
                activeView === "settings"
                  ? "bg-purple-100 text-purple-900"
                  : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
              )}
              title="Settings"
            >
              <div
                className={clsx(
                  "transition-transform duration-500",
                  activeView === "settings" && "rotate-90"
                )}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </button>
            <CustomTitlebar />
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-hidden relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              {activeView === "chat" && <ChatView />}
              {activeView === "clipboard" && <ClipboardView />}
              {activeView === "shortcuts" && <ShortcutsView />}
              {activeView === "layouts" && <LayoutsView />}
              {activeView === "scraping" && <ScrapingView />}
              {activeView === "settings" && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Nav Bar */}
        <nav className="shrink-0 p-4 bg-white border-t-2 border-zinc-100 z-20">
          <div className="flex items-center justify-between gap-3 px-2">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={clsx(
                    "flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all duration-150",
                    isActive
                      ? `${item.color} border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px] active:translate-y-[0px] active:shadow-none`
                      : "bg-white border-transparent hover:bg-zinc-50 hover:border-black/10 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] text-zinc-500 hover:text-zinc-900 active:translate-y-[1px] active:shadow-none"
                  )}
                  title={item.label}
                >
                  <item.icon
                    size={22}
                    strokeWidth={2}
                    className={clsx(isActive ? "text-black" : "text-current")}
                  />
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
