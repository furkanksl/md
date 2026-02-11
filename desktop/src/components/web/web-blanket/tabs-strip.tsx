import { useWebBlanketStore } from "@/stores/web-blanket-store";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function TabsStrip() {
  const { tabs, activeTabId, activateTab, closeTab, createTab } = useWebBlanketStore();

  return (
    <div className="flex w-full mt-0.5 overflow-x-auto items-center py-1 gap-1 bg-background/50 backdrop-blur-sm border-b border-border/10">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => activateTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors max-w-[120px] shrink-0 border border-transparent select-none",
              isActive
                ? "bg-primary/10 text-primary border-primary/20"
                : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            )}
            title={tab.title || tab.url}
          >
            {/* Favicon or fallback */}
            {tab.loading ? (
              <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin shrink-0" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-current/20 shrink-0" />
            )}

            <span className="truncate flex-1">
              {tab.title || "New Tab"}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="opacity-60 hover:opacity-100 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
            >
              <X size={10} />
            </button>
          </div>
        );
      })}

      <button
        onClick={() => createTab()}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
        title="New Tab"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
