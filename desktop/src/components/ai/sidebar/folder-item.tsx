import React from "react";
import { Folder, ChevronRight, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { isImeComposing } from "@/lib/ime";

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
        "flex flex-col rounded-md transition-all duration-200",
        isOver &&
          "bg-muted ring-1 ring-border"
      )}
    >
      <div
        className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer group transition-colors"
        onClick={() => toggleFolder(folder.id)}
        onContextMenu={(e) => onContextMenu(e, "folder", folder.id)}
      >
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          {expanded ? (
            <ChevronDown size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )}
          <Folder size={14} className="text-muted-foreground flex-shrink-0" />

          {editingId === folder.id ? (
            <div
              className="flex items-center flex-1"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-foreground focus:outline-none"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (isImeComposing(e)) return;
                  if (e.key === "Enter") saveEditing(folder.id, true);
                }}
                autoFocus
                onBlur={() => saveEditing(folder.id, true)}
              />
            </div>
          ) : (
            <span className="text-sm font-medium text-muted-foreground truncate">
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
            className="ml-4 pl-2 border-l border-border overflow-hidden"
          >
            {children}
            {React.Children.count(children) === 0 && (
              <div className="text-[10px] text-muted-foreground p-2 italic">
                Empty
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
