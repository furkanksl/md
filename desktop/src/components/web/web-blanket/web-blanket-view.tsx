import { useEffect, useRef, useLayoutEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useWebBlanketStore } from "@/stores/web-blanket-store";
import { useUIStore } from "@/stores/ui-store";
import { TabsStrip } from "./tabs-strip";
import { UrlBar } from "./url-bar";
import { SpeedDial } from "./speed-dial";

export function WebBlanketView() {
  const {
    mode,
    tabs,
    activeTabId,
    syncTabState,
    createTab,
    closeTab,
    reload,
    goBack,
    goForward,
    zoomIn,
    zoomOut,
    setShouldFocusUrlBar,
    isFullScreen
  } = useWebBlanketStore();
  const { theme } = useUIStore();

  const activeTab = tabs.find(t => t.id === activeTabId);
  const hasTabs = tabs.length > 0;
  const shouldShowNative = mode === "browse" && hasTabs && !!activeTab?.url;

  const contentRef = useRef<HTMLDivElement>(null);

  // Measure and send bounds to Rust
  const updateBounds = () => {
    if (!contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();

    // Only update if dimensions are valid
    if (rect.width === 0 || rect.height === 0) return;

    invoke("web_blanket_set_bounds", {
      bounds: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,
      }
    }).then(() => {
      // Ensure shown after bounds set if supposed to be visible
      if (shouldShowNative) {
        invoke("web_blanket_show").catch(() => { });
      }
    }).catch(console.error);
  };

  useEffect(() => {
    if (mode !== "browse" || !contentRef.current) return;

    const observer = new ResizeObserver(() => {
      updateBounds();
    });

    observer.observe(contentRef.current);

    // Initial update
    updateBounds();

    return () => {
      observer.disconnect();
    };
  }, [mode, tabs.length, shouldShowNative, isFullScreen]);

  // Show/Hide native blanket based on logic
  useLayoutEffect(() => {
    if (shouldShowNative) {
      updateBounds();
      // Show is handled in updateBounds callback too, but good to have explicit trigger
      invoke("web_blanket_show").catch(() => { });
    } else {
      invoke("web_blanket_hide").catch(() => { });
    }

    return () => {
      invoke("web_blanket_hide").catch(() => { });
    }
  }, [shouldShowNative]);

  // Sync theme
  useEffect(() => {
    if (mode === "browse") {
      invoke("web_blanket_set_theme", { theme }).catch(console.error);
    }
  }, [mode, theme]);

  // Polling for tab state (loading, title, url)
  useEffect(() => {
    if (mode !== "browse" || !activeTabId) return;

    const interval = setInterval(() => {
      syncTabState(activeTabId);
    }, 500);

    return () => clearInterval(interval);
  }, [mode, activeTabId]);

  // Keyboard Shortcuts
  useEffect(() => {
    if (mode !== "browse") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.metaKey) return;

      switch (e.key) {
        case 't':
          e.preventDefault();
          createTab();
          break;
        case 'w':
          e.preventDefault();
          if (activeTabId) closeTab(activeTabId);
          break;
        case 'l':
          e.preventDefault();
          setShouldFocusUrlBar(true);
          break;
        case 'r':
          e.preventDefault();
          reload();
          break;
        case '[':
          e.preventDefault();
          goBack();
          break;
        case ']':
          e.preventDefault();
          goForward();
          break;
        case '=':
        case '+':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, activeTabId]);

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden">
      {/* Top Bar: Persistent URL Bar */}
      {!isFullScreen && (
      <div className="shrink-0 z-50 py-2 bg-background/40 backdrop-blur-md border-b border-border/10">
        <UrlBar />
      </div>
      )}

      {/* Main Content Area - Native View Host */}
      <div
        ref={contentRef}
        className="flex-1 w-full bg-transparent relative min-h-0"
        style={{ paddingBottom: isFullScreen ? 3 : 0 }}
      >
        {/* If native view is hidden (no tabs or empty tab), show Speed Dial */}
        {!shouldShowNative && (
          <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm p-4">
            <SpeedDial />
          </div>
        )}
      </div>

      {/* Bottom Bar: Tabs */}
      {!isFullScreen && (
      <div className="shrink-0 z-50">
        <TabsStrip />
      </div>
      )}
    </div>
  );
}
