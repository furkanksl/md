import { Edit2, RefreshCw, RotateCcw, Copy, Check } from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";

interface MessageActionsProps {
  isUser: boolean;
  content: string;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onRewind?: () => void;
}

export const MessageActions = ({ isUser, content, onEdit, onRegenerate, onRewind }: MessageActionsProps) => {
  const { isCopied, copyToClipboard } = useClipboard();

  if (isUser) {
    return (
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 -top-6 flex items-center gap-1">
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1 text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Edit"
          >
            <Edit2 size={12} />
          </button>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="p-1 text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Regenerate"
          >
            <RefreshCw size={12} />
          </button>
        )}
        {onRewind && (
          <button
            onClick={onRewind}
            className="p-1 text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Rollback (Delete)"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
    );
  }

  // Assistant Actions
  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
      <button
        onClick={() => copyToClipboard(content)}
        className="p-1 text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1"
        title="Copy"
      >
        {isCopied ? <Check size={12} /> : <Copy size={12} />}
        {isCopied && <span className="text-[10px]">Copied</span>}
      </button>
    </div>
  );
};
