import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FolderItem } from "./folder-item";

interface SortableFolderProps {
  id: string;
  data: any;
  children: React.ReactNode;
  folderProps: any;
}

export const SortableFolder = ({ id, data, children, folderProps }: SortableFolderProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id, data });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <FolderItem {...folderProps} isOver={isOver}>
        {children}
      </FolderItem>
    </div>
  );
};
