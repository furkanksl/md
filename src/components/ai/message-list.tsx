import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { MarkdownRenderer } from '../shared/markdown-renderer';

export const MessageList = () => {
  const messages = useChatStore((state) => state.messages);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

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
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isStreaming, isAtBottom]);

  // Initial scroll to bottom on mount
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, []);

  return (
    <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-col gap-6 h-full overflow-y-auto px-3 py-2 scrollbar-none w-full max-w-3xl mx-auto"
    >
      {messages.map((msg, i) => {
        const isUser = msg.role === 'user';
        return (
          <motion.div
            key={msg.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              "flex flex-col max-w-[85%]",
              isUser ? "self-end items-end" : "self-start items-start"
            )}
          >
            <div
              className={clsx(
                "px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                isUser 
                    ? "bg-stone-800 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-[1.5rem] rounded-tr-none" 
                    : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 rounded-[1.5rem] rounded-tl-none border border-stone-100 dark:border-stone-800"
              )}
            >
              <MarkdownRenderer content={msg.content} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};