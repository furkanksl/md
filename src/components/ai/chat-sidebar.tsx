import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChatStore } from "@/stores/chat-store";
import {
  Folder,
  MessageCircle,
  Plus,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit2,
} from "lucide-react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ------------------------------------------------------------------
// SIMPLE CONTEXT MENU
// ------------------------------------------------------------------
const SidebarContextMenu = ({
  x,
  y,
  type,
  onRename,
  onDelete,
  onMoveToRoot,
  onMoveToFolder,
  folders,
  onClose,
}: any) => {
  return (
    <div
      className="fixed z-[60] bg-white border border-stone-100 rounded-2xl shadow-xl shadow-stone-200/50 min-w-[160px] py-1 text-sm font-medium overflow-hidden"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onRename();
          onClose();
        }}
        className="w-full text-left px-4 py-2 hover:bg-stone-50 text-stone-700 flex items-center gap-2"
      >
        <Edit2 size={14} /> Rename
      </button>

      {type === "chat" && onMoveToRoot && (
        <button
          onClick={() => {
            onMoveToRoot();
            onClose();
          }}
          className="w-full text-left px-4 py-2 hover:bg-stone-50 text-stone-700 flex items-center gap-2"
        >
          <Folder size={14} /> Remove from Folder
        </button>
      )}

      {type === "chat" && folders.length > 0 && (
        <div className="border-t border-stone-100 my-1 pt-1">
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
              className="w-full text-left px-4 py-1.5 hover:bg-stone-50 text-stone-600 truncate"
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-stone-100 my-1" />

      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-400 flex items-center gap-2"
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
};

// ------------------------------------------------------------------
// SORTABLE ITEM WRAPPER
// ------------------------------------------------------------------
const SortableItem = ({
  id,
  data,
  children,
}: {
  id: string;
  data: any;
  children: React.ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
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
      {children}
    </div>
  );
};

// ------------------------------------------------------------------
// CHAT ITEM COMPONENT
// ------------------------------------------------------------------
const ChatItem = ({
  chat,
  activeConversationId,
  setActiveConversationId,
  editingId,
  editValue,
  setEditValue,
  saveEditing,
  onContextMenu,
  onClose,
}: any) => {
  return (
    <div
      className={clsx(
        "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm group transition-colors",
        activeConversationId === chat.id
          ? "bg-white text-stone-800 shadow-sm shadow-stone-200/50"
          : "text-stone-500 hover:bg-stone-100/50 hover:text-stone-700"
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
              className="w-full bg-transparent border-none p-0 text-sm text-stone-800 focus:outline-none"
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

// ------------------------------------------------------------------
// FOLDER ITEM COMPONENT
// ------------------------------------------------------------------
const FolderItem = ({
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
}: any) => {
  return (
    <div
      className={clsx(
        "flex flex-col rounded-xl transition-all duration-200",
        isOver && "bg-stone-100 ring-1 ring-stone-200"
      )}
    >
      <div
        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-100/50 cursor-pointer group transition-colors"
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
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-stone-800 focus:outline-none"
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
            <span className="text-sm font-medium text-stone-600 truncate">
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
            className="ml-4 pl-2 border-l border-stone-200 overflow-hidden"
          >
            {children}
            {React.Children.count(children) === 0 && (
              <div className="text-[10px] text-stone-300 p-2 italic">Empty</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ------------------------------------------------------------------
// SORTABLE FOLDER WRAPPER
// ------------------------------------------------------------------
const SortableFolder = ({ id, data, children, folderProps }: any) => {
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
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
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

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/10 backdrop-blur-[2px] z-30"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute top-0 left-0 bottom-0 w-72 bg-[#FAF9F6] border-r border-stone-200 flex flex-col z-40 shadow-2xl shadow-stone-200/50"
      >
        <div className="p-4 border-b border-stone-100 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Library
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => createFolder("New Folder")}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
            >
              <Folder size={16} />
            </button>
            <button
              onClick={() => createConversation()}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
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
                        startEditing,
                        deleteFolder,
                        onContextMenu: handleContextMenu,
                      }}
                    >
                      <SortableContext
                        items={folder.conversationIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {folder.conversationIds.map((cid) => {
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
                                startEditing={startEditing}
                                deleteConversation={deleteConversation}
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
              <div className="h-px bg-stone-100 mx-2 my-2" />
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
                      startEditing={startEditing}
                      deleteConversation={deleteConversation}
                      onClose={onClose}
                      onContextMenu={handleContextMenu}
                    />
                  </SortableItem>
                );
              })}
            </SortableContext>

            <DroppableRootShim />
          </div>

          {createPortal(
            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: { active: { opacity: "0.5" } },
                }),
              }}
            >
              {activeDragItem ? (
                <div className="bg-white px-3 py-2 rounded-xl shadow-xl border border-stone-100 flex items-center gap-3 w-64 opacity-90 cursor-grabbing">
                  {activeDragItem.type === "folder" ? (
                    <Folder size={14} className="text-stone-400" />
                  ) : (
                    <MessageCircle size={14} className="text-stone-400" />
                  )}
                  <span className="text-sm font-medium text-stone-700 truncate">
                    {activeDragItem.type === "folder"
                      ? activeDragItem.name
                      : activeDragItem.title}
                  </span>
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
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

const DroppableRootShim = () => {
  const { setNodeRef, isOver } = useSortable({
    id: "root-droppable",
    data: { type: "root" },
  });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex-1 min-h-[50px] transition-colors rounded-xl mt-2",
        isOver &&
          "bg-stone-50 ring-1 ring-stone-200 border-dashed border border-stone-300"
      )}
    />
  );
};
