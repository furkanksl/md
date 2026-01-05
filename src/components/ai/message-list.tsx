import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export const MessageList = () => {
  const messages = [
    { id: '1', role: 'assistant', content: 'Good morning. I am ready to assist you.' },
    { id: '2', role: 'user', content: 'Can you summarize my schedule?' },
    { id: '3', role: 'assistant', content: 'Certainly. You have a team sync at 10 AM and a design review at 2 PM.' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {messages.map((msg, i) => {
        const isUser = msg.role === 'user';
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.2 }}
            className={clsx(
              "flex flex-col max-w-[80%]",
              isUser ? "self-end items-end" : "self-start items-start"
            )}
          >
            <div
              className={clsx(
                "px-4 py-2.5 text-sm leading-relaxed",
                isUser 
                    ? "bg-stone-800 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-[2rem] rounded-tr-sm shadow-md shadow-stone-200 dark:shadow-none" 
                    : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 rounded-[2rem] rounded-tl-sm shadow-sm border border-stone-100 dark:border-stone-800"
              )}
            >
              {msg.content}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};