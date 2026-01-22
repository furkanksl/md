import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center bg-[#FAF9F6]/80 backdrop-blur-md transition-all border-b border-transparent hover:border-[#E7E5E4]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#44403C] text-[#FAF9F6] flex items-center justify-center shadow-lg shadow-[#44403C]/10 font-bold text-lg tracking-tighter">
          md
        </div>
        <span className="font-semibold text-base tracking-tight text-[#44403C]">
          My Drawer
        </span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/furkanksl/md"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#44403C]/60 hover:text-[#44403C] transition-colors"
        >
          <Github className="w-4 h-4" strokeWidth={1.5} />
          <span>GitHub</span>
        </a>
        <Button className="rounded-full bg-[#44403C] text-[#FAF9F6] hover:bg-[#44403C]/90 shadow-lg shadow-[#44403C]/10 px-5 h-9 text-sm">
          Download v0.3.0
        </Button>
      </div>
    </header>
  );
};
