import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Minus } from "lucide-react";

export const WindowControls = () => {
  const appWindow = getCurrentWindow();

  return (
    <div className="flex items-center gap-1.5 z-50 bg-white dark:bg-stone-900 p-0.5 rounded-full border border-border">
      <button
        onClick={() => appWindow.minimize()}
        className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        title="Minimize"
      >
        <Minus size={16} strokeWidth={2} />
      </button>
      <button
        onClick={() => appWindow.close()}
        className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-red-500 transition-colors"
        title="Close"
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
};
