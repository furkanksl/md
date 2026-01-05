import {
  Folder,
  Trash2,
  Edit2,
} from "lucide-react";

interface SidebarContextMenuProps {
  x: number;
  y: number;
  type: "chat" | "folder";
  onRename: () => void;
  onDelete: () => void;
  onMoveToRoot?: () => void;
  onMoveToFolder: (folderId: string) => void;
  folders: any[];
  onClose: () => void;
}

export const SidebarContextMenu = ({
  x,
  y,
  type,
  onRename,
  onDelete,
  onMoveToRoot,
  onMoveToFolder,
  folders,
  onClose,
}: SidebarContextMenuProps) => {
  return (
    <div
      className="fixed z-[60] bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl shadow-xl shadow-stone-200/50 dark:shadow-black/50 min-w-[160px] py-1 text-sm font-medium overflow-hidden"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onRename();
          onClose();
        }}
        className="w-full text-left px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-2"
      >
        <Edit2 size={14} /> Rename
      </button>

      {type === "chat" && onMoveToRoot && (
        <button
          onClick={() => {
            onMoveToRoot();
            onClose();
          }}
          className="w-full text-left px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-2"
        >
          <Folder size={14} /> Remove from Folder
        </button>
      )}

      {type === "chat" && folders.length > 0 && (
        <div className="border-t border-stone-100 dark:border-stone-800 my-1 pt-1">
          <div className="px-4 py-1 text-[10px] text-stone-400 uppercase tracking-wider">
            Move to
          </div>
          {folders.map((f: any) => (
            <button
              key={f.id}
              onClick={() => {
                onMoveToFolder(f.id);
                onClose();
              }}
              className="w-full text-left px-4 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 truncate"
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-stone-100 dark:border-stone-800 my-1" />

      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 flex items-center gap-2"
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
};
