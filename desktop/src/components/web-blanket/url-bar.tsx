import { useState, useRef, useEffect } from "react";
import { useWebBlanketStore } from "@/stores/web-blanket-store";
import { cn } from "@/lib/utils";
import { Smartphone, Monitor } from "lucide-react";

export function UrlBar() {
  const { activeTabId, tabs, navigate, createTab, shouldFocusUrlBar, setShouldFocusUrlBar, toggleUserAgent } = useWebBlanketStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const isDesktop = activeTab?.userAgent === "desktop";

  const [inputVal, setInputVal] = useState("");
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when requested (e.g. new empty tab)
  useEffect(() => {
    if (shouldFocusUrlBar && inputRef.current) {
        inputRef.current.focus();
        setShouldFocusUrlBar(false);
    }
  }, [shouldFocusUrlBar, setShouldFocusUrlBar]);

  // Sync input value with active tab URL when not focused
  useEffect(() => {
    if (!hasFocus && activeTab) {
      setInputVal(activeTab.url || "");
    } else if (!activeTab && !hasFocus) {
        // Clear input if no active tab (and not focused)
        setInputVal("");
    }
  }, [activeTab?.url, activeTab, hasFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = inputVal.trim();
    if (!url) return;

    if (activeTabId) {
      navigate(activeTabId, url);
    } else {
      createTab(url);
    }
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      inputRef.current?.blur();
      // Revert to current URL
      if (activeTab) setInputVal(activeTab.url || "");
    }
  };

  return (
    <div className={cn(
      "flex items-center p-1 bg-background/95 backdrop-blur-md rounded-xl border border-border/50",
      "transition-all duration-200"
    )}>
      {/* URL Input */}
      <form onSubmit={handleSubmit} className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onFocus={() => setHasFocus(true)}
          onBlur={() => setHasFocus(false)}
          onKeyDown={handleKeyDown}
          placeholder="Search or enter website name"
          className="w-full h-8 px-3 text-sm bg-accent/50 hover:bg-accent focus:bg-background border border-transparent focus:border-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-left"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            borderRadius: "0.5rem",
          }}
        />
      </form>

      {/* UA Toggle */}
      {activeTabId && (
          <button 
            onClick={() => toggleUserAgent(activeTabId)}
            className="p-1.5 ml-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title={isDesktop ? "Switch to Mobile View" : "Switch to Desktop View"}
          >
            {isDesktop ? <Monitor size={14} /> : <Smartphone size={14} />}
          </button>
      )}
    </div>
  );
}
