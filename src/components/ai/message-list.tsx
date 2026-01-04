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
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={clsx(
              "flex flex-col max-w-[80%]",
              isUser ? "self-end items-end" : "self-start items-start"
            )}
          >
            <div
              className={clsx(
                "px-6 py-3.5 text-[15px] leading-relaxed",
                isUser 
                    ? "bg-stone-800 text-stone-50 rounded-[2rem] rounded-tr-sm shadow-md shadow-stone-200" 
                    : "bg-white text-stone-700 rounded-[2rem] rounded-tl-sm shadow-sm border border-stone-100"
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