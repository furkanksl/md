import { getCurrentWindow } from '@tauri-apps/api/window';
import { X, Minus } from 'lucide-react';

export const WindowControls = () => {
  const appWindow = getCurrentWindow();

  return (
    <div className="flex items-center gap-2 z-50">
      <button
        onClick={() => appWindow.minimize()}
        className="w-7 h-7 flex items-center justify-center bg-white border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        title="Minimize"
      >
        <Minus size={14} strokeWidth={3} className="text-black" />
      </button>
      <button
        onClick={() => appWindow.close()}
        className="w-7 h-7 flex items-center justify-center bg-white hover:bg-red-50 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none group"
        title="Close"
      >
        <X size={14} strokeWidth={3} className="text-black group-hover:text-red-500" />
      </button>
    </div>
  );
};
