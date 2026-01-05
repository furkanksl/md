import React, { useState, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import {
  Folder,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

import { SidebarContextMenu } from "./sidebar/sidebar-context-menu";
import { SortableItem } from "./sidebar/sortable-item";
import { ChatItem } from "./sidebar/chat-item";
import { SortableFolder } from "./sidebar/sortable-folder";
import { DroppableRootShim } from "./sidebar/droppable-root-shim";
import { useSidebarDnd } from "./sidebar/use-sidebar-dnd";
import { SidebarDragOverlay } from "./sidebar/sidebar-drag-overlay";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ------------------------------------------------------------------
// MAIN SIDEBAR
// ------------------------------------------------------------------
export const ChatSidebar = ({ isOpen, onClose }: ChatSidebarProps) => {
  const {
    conversations,
    folders,
    folderOrder,
    rootChatOrder,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    renameConversation,
    createFolder,
    renameFolder,
    deleteConversation,
    deleteFolder,
    reorderFolders,
    reorderRootChats,
    reorderFolderChats,
    moveChatToFolder,
    moveChatToRoot,
    syncStructure,
  } = useChatStore();

  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const {
    activeDragItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useSidebarDnd(
    folderOrder,
    rootChatOrder,
    folders,
    reorderFolders,
    reorderRootChats,
    reorderFolderChats,
    moveChatToFolder,
    moveChatToRoot,
    setExpandedFolders
  );

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "chat" | "folder";
    id: string;
  } | null>(null);

  useEffect(() => {
    syncStructure();
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const saveEditing = (id: string, isFolder: boolean) => {
    if (isFolder) {
      renameFolder(id, editValue);
    } else {
      renameConversation(id, editValue);
    }
    setEditingId(null);
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    type: "chat" | "folder",
    id: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute -inset-4 bg-stone-900/10 backdrop-blur-[2px] z-30"
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "absolute top-0 -left-2 bottom-0 w-72 bg-[#FAF9F6] dark:bg-[#1C1917] border-r border-stone-200 dark:border-stone-800 flex flex-col z-40 shadow-2xl shadow-stone-200/50 dark:shadow-black/50",
          {
            "border-r-0 shadow-none": !isOpen,
          }
        )}
      >
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Library
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => createFolder("New Folder")}
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              <Folder size={16} />
            </button>
            <button
              onClick={() => createConversation()}
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div
            className="flex-1 overflow-y-auto p-4 space-y-1"
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          >
            <div className="mb-2">
              <SortableContext
                items={folderOrder}
                strategy={verticalListSortingStrategy}
              >
                {folderOrder.map((folderId) => {
                  const folder = folders[folderId];
                  if (!folder) return null;
                  return (
                    <SortableFolder
                      key={folderId}
                      id={folderId}
                      data={{ type: "folder", folder }}
                      folderProps={{
                        folder,
                        expanded: expandedFolders[folderId],
                        toggleFolder,
                        editingId,
                        editValue,
                        setEditValue,
                        saveEditing,
                        onContextMenu: handleContextMenu,
                      }}
                    >
                      <SortableContext
                        items={folder.conversationIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {folder.conversationIds.map((cid: string) => {
                          const chat = conversations[cid];
                          if (!chat) return null;
                          return (
                            <SortableItem
                              key={cid}
                              id={cid}
                              data={{ type: "chat", chat }}
                            >
                              <ChatItem
                                chat={chat}
                                activeConversationId={activeConversationId}
                                setActiveConversationId={
                                  setActiveConversationId
                                }
                                editingId={editingId}
                                editValue={editValue}
                                setEditValue={setEditValue}
                                saveEditing={saveEditing}
                                onClose={onClose}
                                onContextMenu={handleContextMenu}
                              />
                            </SortableItem>
                          );
                        })}
                      </SortableContext>
                    </SortableFolder>
                  );
                })}
              </SortableContext>
            </div>

            {folderOrder.length > 0 && (
              <div className="h-px bg-stone-100 dark:bg-stone-800 mx-2 my-2" />
            )}

            <SortableContext
              items={rootChatOrder}
              strategy={verticalListSortingStrategy}
            >
              {rootChatOrder.map((chatId) => {
                const chat = conversations[chatId];
                if (!chat) return null;
                return (
                  <SortableItem
                    key={chatId}
                    id={chatId}
                    data={{ type: "chat", chat }}
                  >
                    <ChatItem
                      chat={chat}
                      activeConversationId={activeConversationId}
                      setActiveConversationId={setActiveConversationId}
                      editingId={editingId}
                      editValue={editValue}
                      setEditValue={setEditValue}
                      saveEditing={saveEditing}
                      onClose={onClose}
                      onContextMenu={handleContextMenu}
                    />
                  </SortableItem>
                );
              })}
            </SortableContext>

            <DroppableRootShim />
          </div>

          <SidebarDragOverlay activeDragItem={activeDragItem} />
        </DndContext>

        {contextMenu && (
          <SidebarContextMenu
            {...contextMenu}
            folders={Object.values(folders)}
            onClose={() => setContextMenu(null)}
            onRename={() => {
              const name =
                contextMenu.type === "folder"
                  ? folders[contextMenu.id]?.name
                  : conversations[contextMenu.id]?.title;
              startEditing(contextMenu.id, name || "");
            }}
            onDelete={() => {
              if (contextMenu.type === "folder") deleteFolder(contextMenu.id);
              else deleteConversation(contextMenu.id);
            }}
            onMoveToRoot={() => moveChatToRoot(contextMenu.id)}
            onMoveToFolder={(folderId: string) =>
              moveChatToFolder(contextMenu.id, folderId)
            }
          />
        )}
      </motion.div>
    </>
  );
};