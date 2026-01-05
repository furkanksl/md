import { useState, useRef, useEffect } from "react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatSidebar } from "./chat-sidebar";
import { useChatStore } from "@/stores/chat-store";
import { MODELS, getModelById } from "@/core/domain/models";
import { useSettingsStore } from "@/stores/settings-store";
import { ChevronDown, Sparkles, History, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

export const ChatView = () => {
  const { selectedModelId, setSelectedModelId, activeConversationId, conversations, rootChatOrder, setActiveConversationId } = useChatStore();
  const { aiConfigurations } = useSettingsStore();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);
  
  const currentModel = getModelById(selectedModelId);
  const activeChat = activeConversationId ? conversations[activeConversationId] : null;

  // Filter available models based on API keys
  const availableModels = MODELS.filter(m => {
      const config = aiConfigurations[m.provider];
      return config && config.apiKey && config.apiKey.length > 0;
  });

  // Auto-select valid model if current one is invalid
  useEffect(() => {
      if (availableModels.length > 0) {
          const isCurrentValid = availableModels.some(m => m.id === selectedModelId);
          if (!isCurrentValid && availableModels[0]) {
              setSelectedModelId(availableModels[0].id);
          }
      }
  }, [aiConfigurations, selectedModelId]);

  // Click outside to close dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsDropdownOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-select latest chat on mount if none active
  useEffect(() => {
      if (!activeConversationId && rootChatOrder.length > 0) {
          // Find most recent by looking at first in root order (assuming sorted) or fallback to any
          setActiveConversationId(rootChatOrder[0] ?? null);
      }
  }, []);

  if (!currentModel) return null;

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
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-all"
            >
                <History size={16} strokeWidth={2} />
            </button>
            {activeChat && (
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300 truncate max-w-[150px]">
                    {activeChat.title}
                </span>
            )}
        </div>

        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors text-xs font-medium px-3 py-1.5 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800"
            >
                <Sparkles size={12} className="text-stone-400 dark:text-stone-500" />
                <span>{currentModel?.name || "Select Model"}</span>
                <ChevronDown size={10} className={clsx("transition-transform", isDropdownOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full right-0 mt-2 w-48 max-h-64 overflow-y-auto scrollbar-none bg-white dark:bg-stone-900 rounded-2xl shadow-xl shadow-stone-200/50 dark:shadow-black/50 py-2 border border-stone-100 dark:border-stone-800 z-20 origin-top-right"
                    >
                        {availableModels.length === 0 ? (
                            <div className="px-4 py-2 text-xs text-stone-400 italic text-center">
                                No providers configured
                            </div>
                        ) : (
                            availableModels.map(m => (
                                <button 
                                    key={m.id}
                                    onClick={() => { setSelectedModelId(m.id); setIsDropdownOpen(false); }}
                                    className={clsx(
                                        "w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between",
                                        selectedModelId === m.id 
                                            ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                                            : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                                    )}
                                >
                                    <span>{m.name}</span>
                                    {m.capabilities.image && <span className="text-[10px] opacity-40 uppercase">Vision</span>}
                                </button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="w-6" /> {/* Spacer for balance */}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 w-full relative">
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
