import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useClipboardStore } from "@/stores/clipboard-store";
import { clsx } from "clsx";
import { ChatView } from "./ai/chat-view";
import { ClipboardView } from "./clipboard/clipboard-view";
import { ShortcutsView } from "./shortcuts/shortcuts-view";
import { LayoutsView } from "./layouts/layouts-view";
import { ScrapingView } from "./scraping/scraping-view";
import { SettingsView } from "./settings/settings-view";
import { OnboardingView } from "./onboarding/onboarding-view";
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
  const { activeView, setActiveView, theme } = useUIStore();
  const { hasCompletedOnboarding } = useSettingsStore();
  const { startMonitoring } = useClipboardStore();

  useEffect(() => {
    startMonitoring();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    // Ensure window is set up
    invoke("set_ignore_mouse_events", {
      ignore: false,
      window: getCurrentWindow(),
    });
  }, []);

  const handleBlur = () => {
    // Trigger native slide out on blur
    invoke("hide_drawer");
  };

  // Listen for window blur event from Tauri
  useEffect(() => {
    const appWindow = getCurrentWindow();
    const unlistenBlur = appWindow.listen("tauri://blur", handleBlur);
    return () => {
      unlistenBlur.then((f) => f());
    };
  }, []);

  const navItems = [
    { id: "chat", label: "Journal", icon: MessageCircle },
    { id: "clipboard", label: "Collect", icon: Archive },
    { id: "shortcuts", label: "Apps", icon: Layers },
    { id: "layouts", label: "Flow", icon: Maximize },
    { id: "scraping", label: "Web", icon: Globe },
    { id: "settings", label: "Setup", icon: Settings },
  ] as const;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FAF9F6] dark:bg-[#1C1917] overflow-hidden font-sans selection:bg-stone-200 dark:selection:bg-stone-700 backdrop-blur-sm rounded-lg border border-stone-200 dark:border-stone-800">
      {/* Drag Region */}
      <div
        className="fixed top-0 left-0 w-full h-8 z-40"
        data-tauri-drag-region
      />

      {/* Main Card */}
      <div className="flex-1 flex flex-col rounded-[2rem] overflow-hidden relative border-none h-full ">
        {/* Minimal Header */}
        <header
          className="h-12 shrink-0 flex items-center justify-between px-3 pl-7 z-50"
          data-tauri-drag-region
        >
          <h1 className="text-lg font-medium tracking-tight text-stone-800 dark:text-stone-200 pointer-events-none">
            MD
          </h1>
          <div className="flex gap-4 items-center">
            <CustomTitlebar />
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-hidden relative px-2">
          <AnimatePresence mode="wait">
            {!hasCompletedOnboarding ? (
                <motion.div
                    key="onboarding"
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(10px)" }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="h-full w-full"
                >
                    <OnboardingView />
                </motion.div>
            ) : (
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(10px)" }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="h-full w-full"
                >
                  {activeView === "chat" && <ChatView />}
                  {activeView === "clipboard" && <ClipboardView />}
                  {activeView === "shortcuts" && <ShortcutsView />}
                  {activeView === "layouts" && <LayoutsView />}
                  {activeView === "scraping" && <ScrapingView />}
                  {activeView === "settings" && <SettingsView />}
                </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Nav Pill - Only show if onboarding completed */}
        {hasCompletedOnboarding && (
            <div className="h-20 flex items-center justify-center shrink-0">
              <nav className="flex items-center gap-1.5 bg-white dark:bg-stone-900 p-1.5 rounded-full shadow-lg shadow-stone-200/50 dark:shadow-none border border-stone-100 dark:border-stone-800">
                {navItems.map((item) => {
                  const isActive = activeView === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative overflow-hidden group",
                        isActive
                          ? "text-stone-800 dark:text-stone-100"
                          : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                      )}
                      title={item.label}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-bg"
                          className="absolute inset-0 bg-stone-100 dark:bg-stone-800 rounded-full"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.2,
                          }}
                        />
                      )}
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2 : 1.5}
                        className="relative z-10"
                      />
                    </button>
                  );
                })}
              </nav>
            </div>
        )}
      </div>
    </div>
  );
};
