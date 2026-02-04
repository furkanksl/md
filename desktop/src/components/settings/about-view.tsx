import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-shell";
import { getVersion } from "@tauri-apps/api/app";
import { Github, Globe } from "lucide-react";

export const AboutView = () => {
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="space-y-2">
        <h1 className="text-3xl font-light tracking-tight text-stone-800 dark:text-stone-100">
          My Drawer
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
          We hope you find it useful!
          <br />
          It woud be great if you could give it a star on GitHub!
        </p>
      </div>

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

      <div className="absolute bottom-8 text-[10px] text-stone-400 dark:text-stone-600 font-mono">
        v{version}
      </div>
    </div>
  );
};
