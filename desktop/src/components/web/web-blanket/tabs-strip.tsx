import { useWebBlanketStore } from "@/stores/web-blanket-store";
import { X, Plus, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function TabsStrip() {
  const {
    tabs,
    activeTabId,
    activateTab,
    closeTab,
    createTab,
    addFavorite,
    setTabMuted,
  } = useWebBlanketStore();

  return (
    <div className="flex w-full mt-0.5 overflow-x-auto items-center py-1 gap-1 bg-background/50 backdrop-blur-sm border-b border-border/10">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <ContextMenu key={tab.id}>
            <ContextMenuTrigger asChild className="group">
              <div
                onClick={() => activateTab(tab.id)}
                className={cn(
                  "flex items-center gap-0 px-1 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors max-w-[120px] shrink-0 border border-transparent select-none",
                  isActive
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "hover:bg-accent hover:text-accent-foreground text-muted-foreground", {
                  "pl-0": tab.muted,
                }
                )}
                title={tab.title || tab.url}
              >
                {tab.loading ? (
                  <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-current/20 shrink-0" />
                )}

                {tab.muted && (
                  <VolumeX size={12} className="opacity-90 shrink-0 mr-1" />
                )}

                <span className="truncate flex-1 w-full">
                  {tab.title || "New Tab"}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => setTabMuted(tab.id, !tab.muted)}>
                {tab.muted ? "Unmute Tab" : "Mute Tab"}
              </ContextMenuItem>
              <ContextMenuItem
                disabled={!tab.url}
                onClick={() => {
                  if (!tab.url) return;
                  addFavorite(tab.title || tab.url, tab.url);
                }}
              >
                Save to Speed Dial
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
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
