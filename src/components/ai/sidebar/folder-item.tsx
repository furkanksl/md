import React from "react";
import { Folder, ChevronRight, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";

interface FolderItemProps {
  folder: any;
  expanded: boolean;
  toggleFolder: (id: string) => void;
  editingId: string | null;
  editValue: string;
  setEditValue: (value: string) => void;
  saveEditing: (id: string, isFolder: boolean) => void;
  onContextMenu: (e: React.MouseEvent, type: "folder", id: string) => void;
  children: React.ReactNode;
  isOver?: boolean;
}

export const FolderItem = ({
  folder,
  expanded,
  toggleFolder,
  editingId,
  editValue,
  setEditValue,
  saveEditing,
  onContextMenu,
  children,
  isOver,
}: FolderItemProps) => {
  return (
    <div
      className={clsx(
        "flex flex-col rounded-xl transition-all duration-200",
        isOver &&
          "bg-stone-100 dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700"
      )}
    >
      <div
        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-100/50 dark:hover:bg-stone-800/50 cursor-pointer group transition-colors"
        onClick={() => toggleFolder(folder.id)}
        onContextMenu={(e) => onContextMenu(e, "folder", folder.id)}
      >
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          {expanded ? (
            <ChevronDown size={14} className="text-stone-400" />
          ) : (
            <ChevronRight size={14} className="text-stone-400" />
          )}
          <Folder size={14} className="text-stone-400 flex-shrink-0" />

          {editingId === folder.id ? (
            <div
              className="flex items-center flex-1"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-stone-800 dark:text-stone-100 focus:outline-none"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEditing(folder.id, true);
                }}
                autoFocus
                onBlur={() => saveEditing(folder.id, true)}
              />
            </div>
          ) : (
            <span className="text-sm font-medium text-stone-600 dark:text-stone-400 truncate">
              {folder.name}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-4 pl-2 border-l border-stone-200 dark:border-stone-800 overflow-hidden"
          >
            {children}
            {React.Children.count(children) === 0 && (
              <div className="text-[10px] text-stone-300 dark:text-stone-600 p-2 italic">
                Empty
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
