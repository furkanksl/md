import { useState, useRef, useEffect } from "react";
import { useWebBlanketStore } from "@/stores/web-blanket-store";
import { cn } from "@/lib/utils";
import { Smartphone, Monitor, Maximize2 } from "lucide-react";
import { HistoryPopover } from "./history-popover";
import { WebHistoryEntry } from "@/core/application/services/history-service";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";

export function UrlBar() {
  const { activeTabId, tabs, navigate, createTab, shouldFocusUrlBar, setShouldFocusUrlBar, toggleUserAgent, setFullScreen, searchHistory, setIsSuggestionsOpen } = useWebBlanketStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const isDesktop = activeTab?.userAgent === "desktop";

  const [inputVal, setInputVal] = useState("");
  const [suggestions, setSuggestions] = useState<WebHistoryEntry[]>([]);
  const [hasFocus, setHasFocus] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [_, setWidth] = useState(0);

  // Focus input when requested
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
      setInputVal("");
    }
  }, [activeTab?.url, activeTab, hasFocus]);

  // Measure width for popover
  useEffect(() => {
    if (inputRef.current) {
      setWidth(inputRef.current.offsetWidth);

      const observer = new ResizeObserver(entries => {
        if (entries[0]) setWidth(entries[0].contentRect.width);
      });

      observer.observe(inputRef.current);
      return () => observer.disconnect();
    }
  }, []);

  // Search suggestions
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    if (hasFocus && inputVal.trim().length > 1) {
      timeout = setTimeout(() => {
        searchHistory(inputVal).then(data => {
          setSuggestions(data);
          setIsSuggestionsOpen(true);
          setSelectedIndex(-1); // Reset selection on new search
        });
      }, 150);
    } else {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      setSelectedIndex(-1);
    }

    return () => {
        if (timeout) clearTimeout(timeout);
    };
  }, [inputVal, hasFocus]);

  const navigateTo = (url: string) => {
    if (!url) return;
    if (activeTabId) {
      navigate(activeTabId, url);
    } else {
      createTab(url);
    }
    inputRef.current?.blur();
    setSuggestions([]);
    setIsSuggestionsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          navigateTo(suggestions[selectedIndex].url);
        } else {
          navigateTo(inputVal.trim());
        }
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
        setSuggestions([]);
        setIsSuggestionsOpen(false);
        if (activeTab) setInputVal(activeTab.url || "");
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        navigateTo(inputVal.trim());
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
        if (activeTab) setInputVal(activeTab.url || "");
      }
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setHasFocus(false);
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className={cn(
      "flex items-center p-1 bg-background/95 backdrop-blur-md rounded-xl border border-border/50",
      "transition-all duration-200 relative z-50 h-10"
    )}>
      <HistoryPopover />

      <div className="flex-1 relative ml-1 h-full group">
        <Popover open={suggestions.length > 0 && hasFocus} modal={false}>
          <PopoverAnchor asChild>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onFocus={() => setHasFocus(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Search or enter website name"
              className="w-full h-full text-sm bg-accent/50 hover:bg-accent focus:bg-background border border-transparent focus:border-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 px-3"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              style={{ borderRadius: '0.50rem' }}
            />
          </PopoverAnchor>
          <PopoverContent
            className="w-[80vw] p-1 bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[300px]"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            align="start"
            alignOffset={-20}
            sideOffset={8}
          // style={{ width: width ? `${width}px` : 'var(--radix-popover-trigger-width)' }}
          >
            {suggestions.map((s, index) => (
              <button
                key={s.id}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                onClick={() => navigateTo(s.url)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer w-full",
                  index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 hover:text-accent-foreground text-foreground",
                  "rounded-md"
                )}
              // style={{ borderRadius: '0.50rem' }}
              >
                {/* <Globe size={14} className="text-muted-foreground shrink-0" /> */}
                <div className="flex flex-col overflow-hidden min-w-0">
                  <span className="text-xs font-medium truncate">{s.title || s.url}</span>
                  <span className="text-[10px] text-muted-foreground truncate opacity-70">{s.url}</span>
                </div>
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Animated Actions (slide in from left) */}
      <div className={cn("flex items-center transition-all duration-300 ease-out", {
        "w-0": !activeTabId,
        "w-auto": activeTabId
      })}>
        {/* Expand Toggle */}
        <div
          className={cn(
            "transition-transform duration-300 ease-out",
            activeTabId
              ? "translate-x-0 opacity-100"
              : "translate-x-8 opacity-0 pointer-events-none"
          )}
        >
          <button
            onClick={() => setFullScreen(true)}
            className="p-1.5 ml-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Enter Full Screen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
        {/* UA Toggle */}
        <div
          className={cn(
            "transition-transform duration-300 ease-out",
            activeTabId
              ? "translate-x-0 opacity-100"
              : "translate-x-8 opacity-0 pointer-events-none"
          )}
        >
          <button
            onClick={() => toggleUserAgent(activeTabId || "")}
            className="p-1.5 ml-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title={isDesktop ? "Switch to Mobile View" : "Switch to Desktop View"}
          >
            {isDesktop ? <Monitor size={14} /> : <Smartphone size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
