import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "../shared/markdown-renderer";
import { Edit2, X, Check } from "lucide-react";

const LoadingDots = () => (
  <div className="flex gap-1 py-1 px-2">
    <motion.div
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
      className="w-1.5 h-1.5 bg-current rounded-full"
    />
    <motion.div
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      className="w-1.5 h-1.5 bg-current rounded-full"
    />
    <motion.div
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
      className="w-1.5 h-1.5 bg-current rounded-full"
    />
  </div>
);

export const MessageList = () => {
  const {
    messages,
    isStreaming,
    editMessage,
    activeConversationId,
    conversations,
  } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const activeChat = activeConversationId
    ? conversations[activeConversationId]
    : null;

  // Check if user is at bottom on scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // 50px threshold for "at bottom"
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
  };

  // Auto-scroll effect
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isStreaming, isAtBottom]);

  // Initial scroll to bottom on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const startEditing = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    setEditingId(null);
    await editMessage(id, editContent);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex flex-col gap-6 h-full overflow-y-auto px-3 py-2 scrollbar-none w-full relative"
    >
      {activeChat && messages.length > 0 && (
        <div className="sticky top-0 z-20 w-full flex justify-center items-center">
          <div className="flex items-center justify-center h-full bg-[#FAF9F6]/30 dark:bg-[#1C1917]/30 backdrop-blur-md px-3 py-1 rounded-full border border-stone-100 dark:border-stone-800/40 shadow-sm">
            <span className="text-[10px] font-medium text-stone-400 dark:text-stone-300 tracking-widest ">
              {activeChat.title}
            </span>
          </div>
        </div>
      )}

      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        const isEditing = editingId === msg.id;

        return (
          <motion.div
            key={msg.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              "flex flex-col max-w-[92%] min-w-0 group",
              isUser ? "self-end items-end" : "self-start items-start"
            )}
          >
            <div
              className={clsx(
                "px-3.5 py-2 text-xs leading-relaxed shadow-sm overflow-hidden relative",
                isUser
                  ? "bg-stone-800 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-[1.25rem] rounded-tr-none"
                  : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 rounded-[1.25rem] rounded-tl-none border border-stone-100 dark:border-stone-800 overflow-x-auto scrollbar-none"
              )}
            >
              {isEditing ? (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-transparent border-none focus:outline-none w-full resize-none text-inherit"
                    rows={Math.max(2, editContent.split("\n").length)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={cancelEditing}
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={() => saveEdit(msg.id)}
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {msg.content === "" && !isUser ? (
                    <LoadingDots />
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                </>
              )}
            </div>

            {/* Edit Button for User Messages */}
            {!isEditing && isUser && !isStreaming && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-2 top-1/2 -translate-y-1/2">
                <button
                  onClick={() => startEditing(msg.id, msg.content)}
                  className="p-1.5 text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  title="Edit"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
