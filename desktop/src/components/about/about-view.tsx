import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-shell";
import { getVersion } from "@tauri-apps/api/app";
import { Github, Globe, RefreshCw } from "lucide-react";
import { useUpdateStore } from "@/stores/update-store";
import { toast } from "sonner";
import { clsx } from "clsx";

export const AboutView = () => {
  const [appVersion, setAppVersion] = useState("");
  const { checkForUpdates, updateAvailable, version: newVersion } = useUpdateStore();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    getVersion().then(setAppVersion);
  }, []);

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    await checkForUpdates();
    setIsChecking(false);

    const store = useUpdateStore.getState();
    if (!store.updateAvailable) {
      toast.success("You are up to date", {
        description: `Version ${appVersion} is the latest available.`,
        className: "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-stone-900 group-[.toaster]:text-stone-950 dark:group-[.toaster]:text-stone-50 group-[.toaster]:border-stone-200 dark:group-[.toaster]:border-stone-800 group-[.toaster]:shadow-lg",
        descriptionClassName: "group-[.toast]:text-stone-500 dark:group-[.toast]:text-stone-400",
      });
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in zoom-in-95 duration-300 relative">
      <div className="space-y-2">
        <h1 className="text-3xl font-light tracking-tight text-stone-800 dark:text-stone-100">
          My Drawer
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
          We hope you find it useful!
          <br />
          It would be great if you could give it a star on GitHub!
        </p>
      </div>

      <div className="flex flex-col gap-3 items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => open("https://mydrawer.furkanksl.com")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-stone-600 dark:text-stone-300 text-xs font-medium"
          >
            <Globe size={14} />
            Website
          </button>
          <button
            onClick={() => open("https://github.com/furkanksl/md")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-stone-600 dark:text-stone-300 text-xs font-medium"
          >
            <Github size={14} />
            GitHub
          </button>
        </div>

        <button
          onClick={handleCheckUpdate}
          disabled={isChecking}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-xs font-medium border",
            updateAvailable
              ? "bg-amber-100/10 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/50"
              : "bg-transparent text-stone-400 border-transparent hover:text-stone-600 hover:bg-stone-50 dark:hover:text-stone-300 dark:hover:bg-stone-800/50"
          )}
        >
          <RefreshCw size={14} className={clsx(isChecking && "animate-spin")} />
          {isChecking ? "Checking..." : updateAvailable ? `Update Available (v${newVersion})` : "Check for Updates"}
        </button>
      </div>

      <div className="absolute bottom-8 text-[10px] text-stone-400 dark:text-stone-600 font-mono">
        v{appVersion}
      </div>
    </div>
  );
};