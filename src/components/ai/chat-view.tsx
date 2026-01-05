import { useState, useRef, useEffect } from "react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatSidebar } from "./chat-sidebar";
import { useChatStore } from "@/stores/chat-store";
import { ChevronDown, Sparkles, History, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const MODELS = [
  { id: "gpt-4", name: "GPT 4" },
  { id: "claude-3", name: "Claude 3" },
];

export const ChatView = () => {
  const { selectedModel, setSelectedModel, activeConversationId } = useChatStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  
  const currentModelName = MODELS.find((m) => m.id === selectedModel)?.name || selectedModel;

  // Window-level drag and drop handlers
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current += 1;
      if (e.dataTransfer?.types?.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      if (e.dataTransfer?.files?.length) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        setAttachments((prev) => {
          const availableSlots = 3 - prev.length;
          if (availableSlots <= 0) return prev;
          const newFiles = droppedFiles.slice(0, availableSlots);
          return [...prev, ...newFiles];
        });
        e.dataTransfer.clearData();
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-[2rem] m-4"
            >
                <div className="p-6 bg-white dark:bg-stone-800 rounded-full shadow-lg shadow-stone-200/50 dark:shadow-black/50 mb-4">
                    <Upload size={32} className="text-stone-400 dark:text-stone-500" />
                </div>
                <h3 className="text-xl font-medium text-stone-600 dark:text-stone-300">Drop files here</h3>
                <p className="text-stone-400 dark:text-stone-500 mt-1">Add up to 3 attachments</p>
            </motion.div>
        )}
      </AnimatePresence>

      <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Gentle Header */}
      <div className="h-12 flex items-center justify-between px-4 shrink-0 relative z-10">
        <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-all"
        >
            <History size={16} strokeWidth={2} />
        </button>

        <div className="relative">
            <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors text-xs font-medium px-3 py-1.5 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800"
            >
                <Sparkles size={12} className="text-stone-400 dark:text-stone-500" />
                <span>{currentModelName}</span>
                <ChevronDown size={10} className={clsx("transition-transform", isDropdownOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-white dark:bg-stone-900 rounded-2xl shadow-xl shadow-stone-200/50 dark:shadow-black/50 py-2 border border-stone-100 dark:border-stone-800 z-20"
                    >
                        {MODELS.map(m => (
                            <button 
                                key={m.id}
                                onClick={() => { setSelectedModel(m.id); setIsDropdownOpen(false); }}
                                className="w-full text-center py-2 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
                            >
                                {m.name}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="w-6" /> {/* Spacer for balance */}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none w-full max-w-3xl mx-auto">
        {activeConversationId ? (
            <MessageList />
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-stone-300 dark:text-stone-700 gap-4">
                <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-stone-900 flex items-center justify-center">
                    <Sparkles size={20} className="opacity-50" />
                </div>
                <p className="text-xs font-medium">How can I help you today?</p>
            </div>
        )}
      </div>

      {/* Input */}
      <div className="py-4 px-3 w-full max-w-3xl mx-auto">
        <MessageInput attachments={attachments} setAttachments={setAttachments} />
      </div>
    </div>
  );
};
