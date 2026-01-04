import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export const MessageList = () => {
  const messages = [
    { id: '1', role: 'assistant', content: 'Ready when you are.' },
    { id: '2', role: 'user', content: 'What’s on the agenda?' },
    { id: '3', role: 'assistant', content: 'Just a few tasks left for the day. You are doing great!' },
  ];

  return (
    <div className="flex flex-col p-4 gap-5 font-sans">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              "flex flex-col max-w-[85%]",
              isUser ? "self-end items-end" : "self-start items-start"
            )}
          >
            {/* Bubble */}
            <div
              className={clsx(
                "px-4 py-3 border-2 border-black text-[15px] font-medium shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                isUser
                  ? "bg-black text-white rounded-2xl rounded-tr-sm"
                  : "bg-white text-zinc-900 rounded-2xl rounded-tl-sm"
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