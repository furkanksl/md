import { MessageCircle } from "lucide-react";
import { clsx } from "clsx";
import { isImeComposing } from "@/lib/ime";

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
        "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm group transition-colors",
        activeConversationId === chat.id
          ? "bg-accent text-accent-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
              className="w-full bg-transparent border-none p-0 text-sm text-foreground focus:outline-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (isImeComposing(e)) return;
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
