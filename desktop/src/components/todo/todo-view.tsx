import { useState, useEffect } from "react";
import { useTodoStore } from "@/stores/todo-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronLeft,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

// --- Sub-Components ---

const SidebarItem = ({
  title,
  updatedAt,
  isActive,
  onClick,
  onDelete,
  onRename,
}: {
  title: string;
  updatedAt: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            onClick={onClick}
            className={cn(
              "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border mb-1",
              isActive
                ? "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm"
                : "border-transparent hover:bg-stone-100 dark:hover:bg-stone-800/50 text-stone-600 dark:text-stone-400"
            )}
          >
            <div className="flex-1 min-w-0 pr-3">
              <h4
                className={cn(
                  "font-medium truncate text-sm",
                  isActive ? "text-stone-900 dark:text-stone-100" : ""
                )}
              >
                {title || "Untitled"}
              </h4>
              <span className="text-xs text-stone-400">
                {formatDistanceToNow(updatedAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-40 bg-stone-50 dark:bg-stone-900">
          <ContextMenuItem onClick={onRename}>
            <Pencil className="mr-2 h-4 w-4" /> Rename
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        description={`Permanently delete "${title || "Untitled"}"?`}
        confirmText="Delete"
        onConfirm={onDelete}
        variant="destructive"
      />
    </>
  );
};

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
    onClick={onClick}
  >
    <ChevronLeft className="h-4 w-4" />
  </Button>
);

const ChecklistView = () => {
  const store = useTodoStore();
  const {
    checklists,
    activeChecklistId,
    createChecklist,
    setActiveChecklist,
    deleteChecklist,
    updateChecklist,
    addItem,
    toggleItem,
    deleteItem,
  } = store;

  // Auto-create if empty
  useEffect(() => {
    if (checklists.length === 0) {
      createChecklist();
    }
  }, [checklists.length, createChecklist]);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const activeList = checklists.find((c) => c.id === activeChecklistId);
  const [newItemText, setNewItemText] = useState("");

  const handleAddItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newItemText.trim()) return;
    addItem(newItemText.trim());
    setNewItemText("");
  };

  const sortedItems = activeList
    ? [...activeList.items].sort((a, b) => {
        if (a.completed === b.completed) return b.createdAt - a.createdAt;
        return a.completed ? 1 : -1;
      })
    : [];

  // Wait for auto-create
  if (checklists.length === 0) return null;

  // Sidebar View
  if (!activeList) {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="flex items-center justify-end p-1 mb-2">
          <Button onClick={createChecklist} size="sm" variant="ghost">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="pb-4">
            {checklists.map((list) => (
              <SidebarItem
                key={list.id}
                title={list.title}
                updatedAt={list.updatedAt}
                isActive={false}
                onClick={() => setActiveChecklist(list.id)}
                onDelete={() => deleteChecklist(list.id)}
                onRename={() => setActiveChecklist(list.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Detail View
  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <header className="flex items-center gap-3 mb-4 shrink-0">
        <BackButton onClick={() => setActiveChecklist(null)} />
        <Input
          value={activeList.title}
          onChange={(e) => updateChecklist(activeList.id, { title: e.target.value })}
          className="font-semibold text-lg border-none shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent"
          placeholder="List Title"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          description="Permanently delete this list?"
          confirmText="Delete"
          onConfirm={() => deleteChecklist(activeList.id)}
          variant="destructive"
        />
      </header>

      <form onSubmit={handleAddItem} className="flex gap-2 mb-4 shrink-0 relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Plus className="h-4 w-4 text-stone-400" />
        </div>
        <Input
          placeholder="Add a new task..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          className="pl-9 border-stone-200 dark:border-stone-800 bg-transparent shadow-sm focus-visible:ring-1 focus-visible:ring-stone-400 dark:focus-visible:ring-stone-600 transition-all"
          autoFocus
        />
      </form>

      <ScrollArea className="flex-1 -mr-3 pr-3">
        <div className="space-y-1 pb-4">
          <AnimatePresence initial={false} mode="popLayout">
            {sortedItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-stone-400 py-8 text-sm"
              >
                No tasks yet.
              </motion.div>
            ) : (
              sortedItems.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "group flex items-start gap-3 p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors",
                    item.completed && "opacity-50"
                  )}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "mt-0.5 flex-shrink-0 transition-colors",
                      item.completed
                        ? "text-stone-400"
                        : "text-stone-300 hover:text-stone-500 dark:hover:text-stone-400"
                    )}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <span
                    className={cn(
                      "flex-1 text-sm pt-0.5 transition-all break-words leading-relaxed",
                      item.completed && "line-through text-stone-500"
                    )}
                  >
                    {item.text}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 -mt-0.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

const NotesView = () => {
  const store = useTodoStore();
  const {
    notes,
    activeNoteId,
    createNote,
    setActiveNote,
    deleteNote,
    updateNote,
  } = store;

  // Auto-create if empty
  useEffect(() => {
    if (notes.length === 0) {
      createNote();
    }
  }, [notes.length, createNote]);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const activeNote = notes.find((n) => n.id === activeNoteId);

  // Wait for auto-create
  if (notes.length === 0) return null;

  // Sidebar View
  if (!activeNote) {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="flex items-center justify-end p-1 mb-2">
          <Button onClick={createNote} size="sm" variant="ghost">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="pb-4">
            {notes.map((note) => (
              <SidebarItem
                key={note.id}
                title={note.title}
                updatedAt={note.updatedAt}
                isActive={false}
                onClick={() => setActiveNote(note.id)}
                onDelete={() => deleteNote(note.id)}
                onRename={() => setActiveNote(note.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Detail View
  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <header className="flex items-center gap-3 mb-2 shrink-0">
        <BackButton onClick={() => setActiveNote(null)} />
        <Input
          value={activeNote.title}
          onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
          className="font-semibold text-lg border-none shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent"
          placeholder="Note Title"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          description="Permanently delete this note?"
          confirmText="Delete"
          onConfirm={() => deleteNote(activeNote.id)}
          variant="destructive"
        />
      </header>

      <Textarea
        placeholder="Type anything here..."
        value={activeNote.content}
        onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
        className="flex-1 resize-none p-4 text-base leading-relaxed border-stone-200 dark:border-stone-800 focus-visible:ring-0 bg-transparent rounded-lg"
        spellCheck={false}
        autoFocus
      />
    </div>
  );
};

// --- Main Component ---

export const TodoView = () => {
  const [activeTab, setActiveTab] = useState("checklist");

  return (
    <div className="h-full flex flex-col p-4 pt-2 gap-4">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Tasks</h2>
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="checklist">Lists</TabsTrigger>
            <TabsTrigger value="scratchpad">Notes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="checklist"
          className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden mt-0"
        >
          <ChecklistView />
        </TabsContent>

        <TabsContent
          value="scratchpad"
          className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden mt-0"
        >
          <NotesView />
        </TabsContent>
      </Tabs>
    </div>
  );
};
