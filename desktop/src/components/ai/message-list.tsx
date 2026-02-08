import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "../shared/markdown-renderer";
import { X, File as FileIcon, ArrowUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageActions } from "./message-actions";

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
    regenerate,
    rewind
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

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    const id = editingId;
    setEditingId(null);
    await editMessage(id, editContent);
    setEditContent("");
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex flex-col gap-6 h-full overflow-y-auto px-3 py-2 scrollbar-none w-full relative"
    >
      {activeChat && messages.length > 0 && (
        <div className="sticky top-0 z-20 w-full flex justify-center items-center">
                      <div className="flex items-center justify-center h-full bg-background/30 backdrop-blur-md px-3 py-1 rounded-full border border-border/40 shadow-sm">            <span className="text-[10px] font-medium text-stone-400 dark:text-stone-300 tracking-widest ">
              {activeChat.title}
            </span>
          </div>
        </div>
      )}

      {messages.map((msg, i) => {
        const isUser = msg.role === "user";

        // Normalize timestamp
        const ts = new Date(msg.timestamp || new Date());

        // Day separator: show if first message or day differs from previous
        const prev = messages[i - 1];
        const prevTs = prev?.timestamp ? new Date(prev.timestamp) : null;
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

        const contentString = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);

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
                "flex flex-col max-w-[92%] min-w-0 group relative",
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
                {msg.content === "" && !isUser ? (
                  <LoadingDots />
                ) : (
                  <MarkdownRenderer content={msg.content} />
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
              <div className={clsx("mt-1 text-[11px] text-stone-400 dark:text-stone-500 select-none flex items-center gap-2", isUser ? "justify-end" : "justify-start")} aria-hidden>
                {timeLabel}
                {!isUser && !isStreaming && (
                  <MessageActions 
                      isUser={false}
                      content={contentString}
                  />
                )}
              </div>

              {/* Action Buttons for User */}
              {isUser && !isStreaming && (
                <MessageActions 
                    isUser={true}
                    content={contentString}
                    onEdit={() => startEditing(msg.id, contentString)}
                    onRegenerate={() => regenerate(msg.id)}
                    onRewind={() => rewind(msg.id)}
                />
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

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && cancelEditing()}>
        <DialogContent hideClose={true} className="max-w-[90%] w-full p-4 gap-2 rounded-3xl md:rounded-2xl sm:rounded-2xl">
          <DialogHeader className="text-left space-y-0">
            <DialogTitle className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase">
              Edit Message
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
              onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
              className="min-h-[150px] resize-none bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 focus-visible:ring-stone-400 dark:focus-visible:ring-stone-600 rounded-2xl pb-9"
            />
            <button
              onClick={saveEdit}
              disabled={!editContent.trim()}
              className={clsx(
                "absolute bottom-2 right-2 w-8 h-8 rounded-full p-0 flex items-center justify-center transition-all duration-300 shadow-none",
                !editContent.trim()
                  ? "bg-stone-100 text-stone-300 cursor-not-allowed dark:bg-stone-800 dark:text-stone-600"
                  : "bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-white"
              )}
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};