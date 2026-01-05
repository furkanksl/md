import { createPortal } from "react-dom";
import { DragOverlay, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import { Folder, MessageCircle } from "lucide-react";

interface SidebarDragOverlayProps {
  activeDragItem: any;
}

export const SidebarDragOverlay = ({ activeDragItem }: SidebarDragOverlayProps) => {
  return createPortal(
    <DragOverlay
      dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: { active: { opacity: "0.5" } },
        }),
      }}
    >
      {activeDragItem ? (
        <div className="bg-white dark:bg-stone-900 px-3 py-2 rounded-xl shadow-xl border border-stone-100 dark:border-stone-800 flex items-center gap-3 w-64 opacity-90 cursor-grabbing">
          {activeDragItem.type === "folder" ? (
            <Folder size={14} className="text-stone-400" />
          ) : (
            <MessageCircle size={14} className="text-stone-400" />
          )}
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">
            {activeDragItem.type === "folder"
              ? activeDragItem.name
              : activeDragItem.title}
          </span>
        </div>
      ) : null}
    </DragOverlay>,
    document.body
  );
};
