import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onOpenDownload: () => void;
}

export const Header = ({ onOpenDownload }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none p-4 md:p-6">
      <motion.nav
        initial={{ y: -20, }}
        animate={{
          y: 0,
          backgroundColor: isScrolled ? 'rgba(250, 249, 246, 0.6)' : 'rgba(250, 249, 246, 0)',
          backdropFilter: isScrolled ? 'blur(16px)' : 'blur(0px)',
          borderColor: isScrolled ? 'rgba(231, 229, 228, 0.8)' : 'rgba(231, 229, 228, 0)',
          height: isScrolled ? 64 : 80,
          boxShadow: isScrolled ? '0 8px 32px -8px rgba(0,0,0,0.05)' : 'none'
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-7xl flex items-center justify-between border border-transparent pointer-events-auto rounded-full px-4 md:px-6 transition-all"
      >
        <div className="font-bold text-lg tracking-tight flex items-center gap-2 text-[#44403C]">
          <div className="w-7 h-7 bg-[#44403C] rounded-[4px] text-sm text-white flex items-center justify-center">md</div>
          <span className="hidden sm:inline">My Drawer</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <a
            href="https://github.com/furkanksl/md"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-[#44403C]/60 hover:text-[#44403C] transition-colors"
          >
            <Github className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <button
            onClick={onOpenDownload}
            className={`bg-[#44403C] text-[#FAF9F6] rounded-full text-sm font-medium hover:bg-[#383531] transition-all shadow-sm hover:shadow-md ${isScrolled ? 'px-4 py-1.5' : 'px-5 py-2'}`}
          >
            Download
          </button>
        </div>
      </motion.nav>
    </div>
  );
};
