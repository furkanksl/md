import { useState } from "react";
import {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

export const useSidebarDnd = (
  folderOrder: string[],
  rootChatOrder: string[],
  folders: Record<string, any>,
  reorderFolders: (order: string[]) => void,
  reorderRootChats: (order: string[]) => void,
  reorderFolderChats: (folderId: string, order: string[]) => void,
  moveChatToFolder: (chatId: string, folderId: string) => void,
  moveChatToRoot: (chatId: string) => void,
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
) => {
  const [activeDragItem, setActiveDragItem] = useState<any>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === "chat") {
      setActiveDragItem({ ...active.data.current?.chat, type: "chat" });
    } else if (type === "folder") {
      setActiveDragItem({ ...active.data.current?.folder, type: "folder" });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === "folder" && overType === "folder") {
      const oldIndex = folderOrder.indexOf(activeId);
      const newIndex = folderOrder.indexOf(overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderFolders(arrayMove(folderOrder, oldIndex, newIndex));
      }
      return;
    }

    if (activeType === "chat" && overType === "chat") {
      const activeInRoot = rootChatOrder.includes(activeId);
      const overInRoot = rootChatOrder.includes(overId);

      if (activeInRoot && overInRoot) {
        const oldIndex = rootChatOrder.indexOf(activeId);
        const newIndex = rootChatOrder.indexOf(overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          reorderRootChats(arrayMove(rootChatOrder, oldIndex, newIndex));
        }
        return;
      }
    }

    if (activeType === "chat" && overType === "chat") {
      const sourceFolder = Object.values(folders).find((f) =>
        f.conversationIds.includes(activeId)
      );
      const targetFolder = Object.values(folders).find((f) =>
        f.conversationIds.includes(overId)
      );

      if (sourceFolder && targetFolder && sourceFolder.id === targetFolder.id) {
        const oldIndex = sourceFolder.conversationIds.indexOf(activeId);
        const newIndex = sourceFolder.conversationIds.indexOf(overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          reorderFolderChats(
            sourceFolder.id,
            arrayMove(sourceFolder.conversationIds, oldIndex, newIndex)
          );
        }
        return;
      }
    }

    if (activeType === "chat" && overType === "folder") {
      moveChatToFolder(activeId, overId);
      setExpandedFolders((prev) => ({ ...prev, [overId]: true }));
      return;
    }

    if (
      activeType === "chat" &&
      (overId === "root-droppable" ||
        (rootChatOrder.includes(overId) && !rootChatOrder.includes(activeId)))
    ) {
      moveChatToRoot(activeId);
      return;
    }
  };

  return {
    activeDragItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
