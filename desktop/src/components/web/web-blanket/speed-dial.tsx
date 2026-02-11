import { useWebBlanketStore, WebBlanketFavorite } from "@/stores/web-blanket-store";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

interface SortableItemProps {
  fav: WebBlanketFavorite;
  onNavigate: (url: string) => void;
  onEdit: (fav: WebBlanketFavorite) => void;
  onDelete: (id: string) => void;
}

function SortableItem({ fav, onNavigate, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: fav.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className="group relative flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer border border-transparent hover:border-border/50 touch-none select-none"
          onClick={() => onNavigate(fav.url)}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 group-hover:scale-110 transition-transform overflow-hidden pointer-events-none">
            <img
              src={fav.iconUrl || `https://www.google.com/s2/favicons?domain=${fav.url}&sz=128`}
              alt={fav.title}
              className="w-6 h-6 object-contain"
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground truncate w-full pointer-events-none">
            {fav.title}
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEdit(fav)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Shortcut
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(fav.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function SpeedDial() {
  const { favorites, addFavorite, updateFavorite, removeFavorite, createTab, activeTabId, navigate, reorderFavorites } = useWebBlanketStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex((f) => f.id === active.id);
      const newIndex = favorites.findIndex((f) => f.id === over.id);
      reorderFavorites(arrayMove(favorites, oldIndex, newIndex));
    }
  };

  const handleNavigate = (url: string) => {
    if (activeTabId) {
      navigate(activeTabId, url);
    } else {
      createTab(url);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setUrlInput("");
    setTitleInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (fav: WebBlanketFavorite) => {
    setEditingId(fav.id);
    setUrlInput(fav.url);
    setTitleInput(fav.title);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput && titleInput) {
      if (editingId) {
        await updateFavorite(editingId, titleInput, urlInput);
      } else {
        await addFavorite(titleInput, urlInput);
      }
      setIsModalOpen(false);
      setUrlInput("");
      setTitleInput("");
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground/80 mb-2">
          New Tab
        </h1>
        {/* <p className="text-sm text-muted-foreground">
          Search or choose a shortcut
        </p> */}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={favorites.map(f => f.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
            {favorites.map((fav) => (
              <SortableItem
                key={fav.id}
                fav={fav}
                onNavigate={handleNavigate}
                onEdit={openEditModal}
                onDelete={removeFavorite}
              />
            ))}

            {/* Add Button */}
            <button
              onClick={openAddModal}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent/50 transition-all cursor-pointer border border-dashed border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary"
            >
              <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center mb-1">
                <Plus size={20} strokeWidth={1.5} />
              </div>
              <span className="text-xs font-medium">Add Shortcut</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-6">
          <form onSubmit={handleSave} className="w-full max-w-xs space-y-4 bg-card p-6 rounded-2xl border border-border shadow-xl">
            <h3 className="text-lg font-semibold">{editingId ? "Edit Shortcut" : "Add Shortcut"}</h3>
            <div className="space-y-2">
              <input
                className="w-full p-2 text-sm bg-accent/50 rounded-lg border border-transparent focus:border-primary/50 outline-none"
                placeholder="Title (e.g. YouTube)"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                autoFocus
              />
              <input
                className="w-full p-2 text-sm bg-accent/50 rounded-lg border border-transparent focus:border-primary/50 outline-none"
                placeholder="URL (e.g. youtube.com)"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!titleInput || !urlInput}
                className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
