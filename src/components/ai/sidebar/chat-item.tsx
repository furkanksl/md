import { MessageCircle } from "lucide-react";
import { clsx } from "clsx";

interface ChatItemProps {
  chat: any;
  activeConversationId: string | null;
  setActiveConversationId: (id: string) => void;
  editingId: string | null;
  editValue: string;
  setEditValue: (value: string) => void;
  saveEditing: (id: string, isFolder: boolean) => void;
  onContextMenu: (e: React.MouseEvent, type: "chat", id: string) => void;
  onClose: () => void;
}

export const ChatItem = ({
  chat,
  activeConversationId,
  setActiveConversationId,
  editingId,
  editValue,
  setEditValue,
  saveEditing,
  onContextMenu,
  onClose,
}: ChatItemProps) => {
  return (
    <div
      className={clsx(
        "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm group transition-colors",
        activeConversationId === chat.id
          ? "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 shadow-sm shadow-stone-200/50 dark:shadow-none"
          : "text-stone-500 dark:text-stone-400 hover:bg-stone-100/50 dark:hover:bg-stone-800/50 hover:text-stone-700 dark:hover:text-stone-200"
      )}
      onClick={() => {
        if (editingId !== chat.id) {
          setActiveConversationId(chat.id);
          onClose();
        }
      }}
      onContextMenu={(e) => onContextMenu(e, "chat", chat.id)}
    >
      <div className="flex items-center gap-3 truncate flex-1">
        <MessageCircle size={14} className="flex-shrink-0 opacity-70" />
        {editingId === chat.id ? (
          <div
            className="flex items-center flex-1"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              className="w-full bg-transparent border-none p-0 text-sm text-stone-800 dark:text-stone-100 focus:outline-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEditing(chat.id, false);
              }}
              autoFocus
              onBlur={() => saveEditing(chat.id, false)}
            />
          </div>
        ) : (
          <span className="truncate font-medium">{chat.title}</span>
        )}
      </div>
    </div>
  );
};
