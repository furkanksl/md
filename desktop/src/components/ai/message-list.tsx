import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "../shared/markdown-renderer";
import { Edit2, X, Check, File as FileIcon } from "lucide-react";

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

  // Lightbox preview state
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

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

  // Lightbox keyboard handling (Escape to close)
  useEffect(() => {
    if (!previewSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewSrc(null);
        setPreviewName(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewSrc]);

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

        // Normalize timestamp
        const ts = msg.timestamp ? (typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp) : new Date();

        // Day separator: show if first message or day differs from previous
        const prev = messages[i - 1];
        const prevTs = prev ? (prev.timestamp ? (typeof prev.timestamp === 'string' ? new Date(prev.timestamp) : prev.timestamp) : null) : null;
        const isNewDay = !prevTs || ts.toDateString() !== prevTs.toDateString();

        // Time string (always shown outside the bubble)
        const timeLabel = ts.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        // Localized date label for day separators
        const dateLabel = (() => {
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          if (ts.toDateString() === today.toDateString()) return new Intl.DateTimeFormat(undefined, { weekday: 'long', hour: undefined }).format(ts) === undefined ? 'Today' : (navigator.language && (new Intl.DateTimeFormat(navigator.language, { weekday: 'long' }).format(ts))) || 'Today';
          if (ts.toDateString() === yesterday.toDateString()) return 'Yesterday';
          return new Intl.DateTimeFormat(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }).format(ts);
        })();

        return (
          <div key={msg.id || i} className="w-full">
            {isNewDay && (
              <div className="w-full flex items-center my-3">
                <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800" />
                <div className="px-3 text-[11px] text-stone-400 dark:text-stone-500 whitespace-nowrap">{dateLabel}</div>
                <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800" />
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={clsx(
                "flex flex-col max-w-[92%] min-w-0",
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

              {/* Attachments (images) rendered outside the bubble */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={clsx("mt-2 flex gap-3", isUser ? "justify-end" : "justify-start")}>
                  {msg.attachments.map((att: any, idx: number) => {
                    const isImage = att.type?.startsWith?.('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(att.name || '');
                    const src = att.base64 || (att.path ? `file://${att.path}` : undefined);
                    if (isImage && src) {
                      return (
                        <button key={idx} onClick={() => { setPreviewSrc(src); setPreviewName(att.name); }} className="block p-0 bg-transparent border-0">
                          <img src={src} alt={att.name || 'image'} className="w-24 h-24 object-cover rounded-lg border border-stone-100 dark:border-stone-800 shadow-sm cursor-zoom-in" />
                        </button>
                      );
                    }
                    // Fallback for non-image attachments
                    return (
                      <div key={idx} className="px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-xs">
                        <a href={att.base64 || att.path} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2">
                          <FileIcon size={14} />
                          <span className="truncate max-w-[160px]">{att.name}</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Timestamp (always visible, outside bubble) */}
              <div className={clsx("mt-1 text-[11px] text-stone-400 dark:text-stone-500 select-none", isUser ? "text-right" : "text-left")} aria-hidden>
                {timeLabel}
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
          </div>
        );
      })}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {previewSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 rounded-lg border border-stone-100 dark:border-stone-800"
            onClick={() => { setPreviewSrc(null); setPreviewName(null); }}
          >
            <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} exit={{ scale: 0.98 }} className="flex max-w-[90%] max-h-[80vh] p-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-3 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
                  <div className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">{previewName}</div>
                  <button onClick={() => { setPreviewSrc(null); setPreviewName(null); }} className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">
                    <X size={16} />
                  </button>
                </div>
                <div className="p-4 flex items-center justify-center">
                  <img src={previewSrc} alt={previewName || 'preview'} className="max-w-full max-h-[60vh] object-contain" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
