import { useUIStore } from "@/stores/ui-store";
import { clsx } from "clsx";
import { ChatView } from "./ai/chat-view";
import { ClipboardView } from "./clipboard/clipboard-view";
import { ShortcutsView } from "./shortcuts/shortcuts-view";
import { LayoutsView } from "./layouts/layouts-view";
import { ScrapingView } from "./scraping/scraping-view";
import { SettingsView } from "./settings/settings-view";
import { CustomTitlebar } from "./shared/custom-titlebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Archive,
  Layers,
  Maximize,
  Globe,
  Settings,
} from "lucide-react";

export const MainLayout = () => {
  const { activeView, setActiveView } = useUIStore();

  const navItems = [
    { id: "chat", label: "Journal", icon: MessageCircle },
    { id: "clipboard", label: "Collect", icon: Archive },
    { id: "shortcuts", label: "Apps", icon: Layers },
    { id: "layouts", label: "Flow", icon: Maximize },
    { id: "scraping", label: "Web", icon: Globe },
    { id: "settings", label: "Setup", icon: Settings },
  ] as const;

  return (
    <div className="flex flex-col h-screen w-screen bg-transparent overflow-hidden font-sans selection:bg-stone-200">
      {/* Drag Region */}
      <div
        className="fixed top-0 left-0 w-full h-8 z-40"
        data-tauri-drag-region
      />

      {/* Main Card */}
      <div className="flex-1 flex flex-col bg-[#FAF9F6] rounded-[2rem] overflow-hidden relative border-none">
        {/* Minimal Header */}
        <header
          className="h-16 shrink-0 flex items-center justify-between px-4 z-50"
          data-tauri-drag-region
        >
          <h1 className="text-xl font-medium tracking-tight text-stone-800 pointer-events-none">
            my drawer
          </h1>
          <div className="flex gap-4 items-center">
            <span className="text-xs text-stone-400 font-medium tracking-wider uppercase pointer-events-none">
              {new Date().toLocaleDateString("en-US", { weekday: "long" })}
            </span>
            <CustomTitlebar />
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-hidden relative px-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full w-full"
            >
              {" "}
              {activeView === "chat" && <ChatView />}
              {activeView === "clipboard" && <ClipboardView />}
              {activeView === "shortcuts" && <ShortcutsView />}
              {activeView === "layouts" && <LayoutsView />}
              {activeView === "scraping" && <ScrapingView />}
              {activeView === "settings" && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Nav Pill */}
        <div className="h-24 flex items-center justify-center shrink-0">
          <nav className="flex items-center gap-2 bg-white p-2 rounded-full shadow-lg shadow-stone-200/50 border border-stone-100">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={clsx(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 relative overflow-hidden group",
                    isActive
                      ? "text-stone-800"
                      : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                  )}
                  title={item.label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-bg"
                      className="absolute inset-0 bg-stone-100 rounded-full"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.2,
                      }}
                    />
                  )}
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="relative z-10"
                  />
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
