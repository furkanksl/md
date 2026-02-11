import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useClipboardStore } from "@/stores/clipboard-store";
import { useShortcutsStore } from "@/stores/shortcuts-store";
import { useUpdateStore } from "@/stores/update-store";
import { clsx } from "clsx";
import { ChatView } from "./ai/chat-view";
import { ClipboardView } from "./clipboard/clipboard-view";
import { ShortcutsView } from "./shortcuts/shortcuts-view";
import { LayoutsView } from "./layouts/layouts-view";
import { ScrapingView } from "./scraping/scraping-view";
import { SettingsView } from "./settings/settings-view";
import { TodoView } from "./todo/todo-view";
import { OnboardingView } from "./onboarding/onboarding-view";
import { AboutView } from "./about/about-view";
import { CustomTitlebar } from "./shared/custom-titlebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Archive,
  Layers,
  Maximize,
  Globe,
  Settings,
  Sun,
  Moon,
  ListTodo,
} from "lucide-react";

export const MainLayout = () => {
  const { activeView, setActiveView, theme, setTheme, themeName } = useUIStore();
  const { hasCompletedOnboarding } = useSettingsStore();
  const { startMonitoring } = useClipboardStore();
  const { updateAvailable, showPoster } = useUpdateStore();

  useEffect(() => {
    startMonitoring();
    useSettingsStore.getState().init();
    useShortcutsStore.getState().init();
  }, []);

  useEffect(() => {
    if (window.umami) {
      window.umami.track((props: any) => ({
        ...props,
        url: `/${activeView}`,
        title: activeView.charAt(0).toUpperCase() + activeView.slice(1),
      }));
    }
  }, [activeView]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.setAttribute("data-theme", themeName);
  }, [theme, themeName]);

  useEffect(() => {
    // Ensure window is set up
    invoke("set_ignore_mouse_events", {
      ignore: false,
      window: getCurrentWindow(),
    });
  }, []);

  // Ref to track latest autoHide preference without re-binding listeners constantly
  const autoHideRef = useRef(useSettingsStore.getState().autoHide);
  useEffect(() => {
    const unsubscribe = useSettingsStore.subscribe((state) => {
      autoHideRef.current = state.autoHide;
    });
    return () => unsubscribe();
  }, []);

  // Listen for window blur event from Tauri
  useEffect(() => {
    const appWindow = getCurrentWindow();
    const unlistenBlur = appWindow.listen("tauri://blur", () => {
      if (autoHideRef.current) {
        invoke("hide_drawer");
      }
    });
    return () => {
      unlistenBlur.then((f) => f());
    };
  }, []);

  const bottomNavItems = [
    { id: "chat", label: "Journal", icon: MessageCircle },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "clipboard", label: "Collect", icon: Archive },
    { id: "shortcuts", label: "Apps", icon: Layers },
    { id: "layouts", label: "Flow", icon: Maximize },
    { id: "scraping", label: "Web", icon: Globe },
  ] as const;

  const headerNavItems = [
    { id: "settings", label: "Setup", icon: Settings },
  ] as const;

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden font-sans selection:bg-accent selection:text-accent-foreground backdrop-blur-sm rounded-[2rem] border border-border">
      {/* Drag Region */}
      <div
        className="fixed top-0 left-0 w-full h-8 z-40"
        data-tauri-drag-region
      />

      {/* Main Card */}
      <div className="flex-1 flex flex-col rounded-[3rem] overflow-hidden relative border-none h-full ">
        {/* Minimal Header */}
        <header
          className="h-12 shrink-0 flex items-center justify-between pr-2 pl-6 z-50"
          data-tauri-drag-region
        >
          <div className="relative">
            <h1
              className="text-lg font-medium tracking-tight text-foreground cursor-pointer font-sans pointer-events-auto hover:underline"
              onClick={() => setActiveView("about")}
            >
              md
            </h1>
            {updateAvailable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showPoster();
                }}
                className="absolute -top-1 -right-2 flex h-3 w-3 cursor-pointer z-50 hover:scale-110 transition-transform"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-white dark:ring-stone-900"></span>
              </button>
            )}
          </div>
          <div className="flex gap-1 items-center">
            {/* Header Navigation Items */}
            {hasCompletedOnboarding && headerNavItems.map((item) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={clsx(
                    "w-8 h-8 flex items-center justify-center rounded-full transition-colors relative z-50",
                    isActive
                      ? "text-accent-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  title={item.label}
                >
                  <Icon size={16} strokeWidth={1.5} />
                </button>
              );
            })}

            <div className="w-px h-4 bg-border" />

            {/* Minimal theme toggle */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={
                theme === "light" ? "Switch to dark mode" : "Switch to light mode"
              }
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-accent p-0"
            >
              <motion.div
                key={theme}
                initial={{ rotate: -10, opacity: 0, scale: 0.95 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 10, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22 }}
                className="flex items-center justify-center w-5 h-5 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {theme === "light" ? (
                  <Moon size={16} strokeWidth={1.5} className="block" />
                ) : (
                  <Sun size={16} strokeWidth={1.5} className="block" />
                )}
              </motion.div>
            </button>

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
                {activeView === "tasks" && <TodoView />}
                {activeView === "clipboard" && <ClipboardView />}
                {activeView === "shortcuts" && <ShortcutsView />}
                {activeView === "layouts" && <LayoutsView />}
                {activeView === "scraping" && <ScrapingView />}
                {activeView === "settings" && <SettingsView />}
                {activeView === "about" && <AboutView />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Nav Pill - Only show if onboarding completed */}
        {hasCompletedOnboarding && (
          <div className="h-16 flex items-center justify-center shrink-0">
            <nav className="flex items-center gap-x-1.5 bg-card p-1.5 rounded-full shadow-lg border border-border">
              {bottomNavItems.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (activeView === "scraping" && item.id !== "scraping") {
                        invoke("web_blanket_hide").catch(() => {});
                      }
                      setActiveView(item.id as any);
                    }}
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative overflow-hidden group",
                      isActive
                        ? "text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                    title={item.label}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-bg"
                        className="absolute inset-0 bg-accent rounded-full"
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