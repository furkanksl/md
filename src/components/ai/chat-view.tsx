import { useState, useRef, useEffect } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { useChatStore } from "@/stores/chat-store";
import { useSettingsStore } from "@/stores/settings-store";
import { History, ChevronDown, MessageCircle, Upload } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const AVAILABLE_MODELS = [
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
  { id: "claude-3-opus", name: "Claude 3 Opus" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  { id: "mistral-large", name: "Mistral Large" },
];

export const ChatView = () => {
  const { selectedModel, setSelectedModel, activeConversationId } =
    useChatStore();
  const { activeProvider } = useSettingsStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // HTML5 Drag and Drop Handlers (Window Scope)
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current += 1;
      // In Tauri with dragDropEnabled: false, dataTransfer.items may not be populated
      // Check for 'Files' type instead, or just show overlay on any drag
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

      if (
        e.dataTransfer &&
        e.dataTransfer.files &&
        e.dataTransfer.files.length > 0
      ) {
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
  }, []); // Dependencies: setAttachments is stable (from useState/Zustand logic usually, but here it's local useState which is stable-ish or we can omit as standard practice for window listeners)

  const currentModelName =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name || selectedModel;

  return (
    <div className="flex h-full bg-white relative overflow-hidden">
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black flex flex-col items-center gap-4 transform rotate-1">
              <div className="p-4 bg-blue-100 rounded-full border-2 border-black">
                <Upload size={48} strokeWidth={1.5} className="text-black" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black text-black uppercase tracking-tight">
                  Drop it like it's hot
                </h3>
                <p className="text-sm font-medium text-zinc-500 mt-1">
                  Add up to 3 files
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar (History & Folders) - Sliding Overlay */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative bg-white">
        {/* Chat Header (Model Selector) */}
        <div className="h-14 border-b-2 border-zinc-100 flex items-center justify-between px-4 bg-white/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"
              title="History"
            >
              <History size={20} strokeWidth={2} />
            </button>

            <div className="h-6 w-0.5 bg-zinc-200" />

            {/* Custom Model Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-zinc-200 rounded-lg hover:border-zinc-400 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-all active:translate-y-[1px] active:shadow-none"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Model:
                </span>
                <span className="text-sm font-bold text-zinc-800">
                  {currentModelName}
                </span>
                <ChevronDown
                  size={14}
                  className={clsx(
                    "text-zinc-400 transition-transform duration-200",
                    isModelDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence>
                {isModelDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden z-20"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={clsx(
                          "w-full text-left px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors flex justify-between items-center",
                          selectedModel === m.id
                            ? "text-blue-600 bg-blue-50/50"
                            : "text-zinc-700"
                        )}
                      >
                        {m.name}
                        {selectedModel === m.id && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-full">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Provider
            </span>
            <span className="text-xs font-bold uppercase text-zinc-700">
              {activeProvider}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto relative scroll-smooth bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          {activeConversationId ? (
            <MessageList />
          ) : (
            <div className="h-full flex flex-col gap-4 items-center justify-center text-zinc-400">
              <MessageCircle size={48} strokeWidth={1} className="opacity-20" />
              <span className="text-sm font-medium">
                Select a chat to begin
              </span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t-2 border-zinc-100">
          <MessageInput
            attachments={attachments}
            setAttachments={setAttachments}
          />
        </div>
      </div>
    </div>
  );
};
