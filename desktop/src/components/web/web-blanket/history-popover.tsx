import { useState, useEffect } from "react";
import { useWebBlanketStore } from "@/stores/web-blanket-store";
import { WebHistoryEntry, HistoryFilter } from "@/core/application/services/history-service";
import { History, Trash2, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_week", label: "Last Week" },
  { id: "last_month", label: "Last Month" },
  { id: "all", label: "All" },
];

export function HistoryPopover() {
  const { getHistory, clearHistory, navigate, activeTabId, createTab, isHistoryOpen, setIsHistoryOpen } = useWebBlanketStore();
  const [history, setHistory] = useState<WebHistoryEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("today");

  useEffect(() => {
    if (isHistoryOpen) {
      loadHistory();
    }
  }, [isHistoryOpen, activeFilter]);

  const loadHistory = async () => {
    const data = await getHistory(activeFilter);
    setHistory(data);
  };

  const handleClear = async () => {
    await clearHistory();
    loadHistory();
  };

  const handleNavigate = (url: string) => {
    if (activeTabId) {
      navigate(activeTabId, url);
    } else {
      createTab(url);
    }
    setIsHistoryOpen(false);
  };

  return (
    <Popover open={isHistoryOpen} onOpenChange={() => setIsHistoryOpen(!isHistoryOpen)}>
      <PopoverTrigger asChild>
        <button
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="History"
        >
          <History size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] p-0 mx-auto overflow-hidden flex flex-col max-h-[500px]" align="start" alignOffset={-10} sideOffset={10}>
        {/* Filters */}
        <div className="flex items-center justify-between gap-1 min-h-10 p-2 border-b overflow-x-auto scrollbar-none bg-background">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors",
                activeFilter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 hover:bg-muted p-1 rounded transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0 p-1">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <History size={24} className="opacity-20" />
              <span className="text-xs">No history found</span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleNavigate(entry.url)}
                  className="flex flex-col gap-0.5 w-full text-left p-2 rounded hover:bg-accent/50 group transition-colors"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Globe size={12} className="text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium truncate flex-1">
                      {entry.title || entry.url}
                    </span>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate pl-5 opacity-70 group-hover:opacity-100 transition-opacity">
                    {entry.url}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
