import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Minus } from "lucide-react";

export const WindowControls = () => {
  const appWindow = getCurrentWindow();

  return (
    <div className="flex items-center gap-1.5 z-50 bg-white dark:bg-stone-900 px-1 py-0.5 rounded-full shadow-lg shadow-stone-200/50 dark:shadow-none border border-stone-100 dark:border-stone-800">
      <button
        onClick={() => appWindow.minimize()}
        className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300 transition-colors"
        title="Minimize"
      >
        <Minus size={16} strokeWidth={2} />
      </button>
      <button
        onClick={() => appWindow.close()}
        className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
        title="Close"
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
};
