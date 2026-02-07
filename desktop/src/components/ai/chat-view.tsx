import { useState, useRef, useEffect } from "react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatSidebar } from "./chat-sidebar";
import { useChatStore } from "@/stores/chat-store";
import { MODELS, getModelById } from "@/core/domain/models";
import { useSettingsStore } from "@/stores/settings-store";
import {
  ChevronDown,
  Sparkles,
  History,
  Upload,
  SquarePen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ChatView = () => {
  const {
    messages,
    selectedModelId,
    setSelectedModelId,
    activeConversationId,
    rootChatOrder,
    setActiveConversationId,
    createConversation,
  } = useChatStore();
  const { aiConfigurations } = useSettingsStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Filter available models based on API keys
  const standardModels = MODELS.filter((m) => {
    const config = aiConfigurations[m.provider];
    return config && config.apiKey && config.apiKey.length > 0;
  });

  const customConfig = aiConfigurations['custom'];
  const customModels = (customConfig?.customModels || []).map(cm => ({
    id: cm.id,
    name: cm.name,
    provider: 'custom' as const,
    capabilities: { image: false, audio: false, tools: false }, // Assume basic text for now
    config: {
      baseUrl: cm.baseUrl,
      apiKey: cm.apiKey,
      modelId: cm.modelId
    }
  }));

  const availableModels = [...standardModels, ...customModels];

  const currentModel = availableModels.find(m => m.id === selectedModelId) || getModelById(selectedModelId) || availableModels[0];

  // Auto-select valid model if current one is invalid
  useEffect(() => {
    if (availableModels.length > 0) {
      const isCurrentValid = availableModels.some(
        (m) => m.id === selectedModelId
      );
      if (!isCurrentValid && availableModels[0]) {
        setSelectedModelId(availableModels[0].id);
      }
    }
  }, [aiConfigurations, selectedModelId]);

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
              <Upload
                size={32}
                className="text-stone-400 dark:text-stone-500"
              />
            </div>
            <h3 className="text-xl font-medium text-stone-600 dark:text-stone-300">
              Drop files here
            </h3>
            <p className="text-stone-400 dark:text-stone-500 mt-1">
              Add up to 3 attachments
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Gentle Header */}
      <div className="h-12 grid grid-cols-3 items-center px-4 shrink-0 relative z-10">
        <div className="flex items-center gap-3 justify-start overflow-hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-all flex-shrink-0"
          >
            <History size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors text-xs font-medium px-3 py-1.5 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 outline-none max-w-xl">
                <Sparkles
                  size={12}
                  className="text-stone-400 dark:text-stone-500 flex-shrink-0"
                />
                <span className="truncate">
                  {currentModel?.name || "Select Model"}
                </span>
                <ChevronDown size={10} className="opacity-50 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-64 max-h-[32rem] overflow-y-auto scrollbar-none bg-white dark:bg-stone-900 rounded-2xl shadow-xl shadow-stone-200/50 dark:shadow-black/50 py-1 border border-stone-100 dark:border-stone-800 z-50"
            >
              {availableModels.length === 0 ? (
                <div className="px-4 py-2 text-xs text-stone-500 dark:text-stone-400 italic text-center">
                  No providers configured
                </div>
              ) : (
                Object.entries(
                  availableModels.reduce((acc, model) => {
                    if (!acc[model.provider]) {
                      acc[model.provider] = [];
                    }
                    acc[model.provider]?.push(model);
                    return acc;
                  }, {} as Record<string, typeof availableModels>)
                ).map(([provider, models], index) => (
                  <div key={provider}>
                    {index > 0 && (
                      <div className="h-px bg-stone-100 dark:bg-stone-800 mx-2 my-1" />
                    )}
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      {provider}
                    </div>
                    {models.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => setSelectedModelId(m.id)}
                        className={clsx(
                          "w-full px-4 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer focus:bg-stone-50 dark:focus:bg-stone-800 focus:text-stone-900 dark:focus:text-stone-100",
                          selectedModelId === m.id
                            ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                            : "text-stone-600 dark:text-stone-400"
                        )}
                      >
                        <span>{m.name}</span>
                        {m.capabilities.image && (
                          <span className="text-[10px] opacity-40 uppercase">
                            Vision
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => createConversation()}
            className="p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-all"
            title="New Chat"
          >
            <SquarePen size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 w-full relative">
        {messages.length > 0 ? (
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
        <MessageInput
          attachments={attachments}
          setAttachments={setAttachments}
        />
      </div>
    </div>
  );
};
