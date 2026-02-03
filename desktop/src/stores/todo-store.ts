import { create } from "zustand";
import { ChecklistRepository, ChecklistItemRepository, NoteRepository } from "@/core/infra/repositories";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Checklist {
  id: string;
  title: string;
  items: TodoItem[];
  updatedAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface TodoState {
  isInitialized: boolean;

  // Checklists
  checklists: Checklist[];
  activeChecklistId: string | null;
  createChecklist: () => Promise<void>;
  updateChecklist: (id: string, updates: Partial<Checklist>) => Promise<void>;
  deleteChecklist: (id: string) => Promise<void>;
  setActiveChecklist: (id: string | null) => void;

  // Checklist Items
  addItem: (text: string) => Promise<void>;
  toggleItem: (itemId: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  updateItemText: (itemId: string, text: string) => Promise<void>;

  // Notes
  notes: Note[];
  activeNoteId: string | null;
  createNote: () => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNote: (id: string | null) => void;

  // Init
  init: () => Promise<void>;
}

// Instantiate repositories
const checklistRepo = new ChecklistRepository();
const checklistItemRepo = new ChecklistItemRepository();
const noteRepo = new NoteRepository();

export const useTodoStore = create<TodoState>((set, get) => ({
  isInitialized: false,
  checklists: [],
  activeChecklistId: null,
  notes: [],
  activeNoteId: null,

  init: async () => {
    try {
      const [checklists, notes] = await Promise.all([
        checklistRepo.getAll(),
        noteRepo.getAll(),
      ]);
      set({ checklists, notes, isInitialized: true });
    } catch (e) {
      console.error("Failed to initialize TodoStore:", e);
      set({ isInitialized: true }); // Still set true so app doesn't hang
    }
  },

  // --- Checklists ---

  createChecklist: async () => {
    const state = get();
    // Check if the most recent list is "empty" (default title and no items)
    // Assuming lists are ordered by updatedAt DESC (newest first) in state
    const recent = state.checklists[0];
    if (recent && recent.title === "New List" && recent.items.length === 0) {
      set({ activeChecklistId: recent.id });
      return;
    }

    try {
      const newChecklist = await checklistRepo.create("New List");
      set((state) => ({
        checklists: [newChecklist, ...state.checklists],
        activeChecklistId: newChecklist.id,
      }));
    } catch (e) {
      console.error("Failed to create checklist:", e);
    }
  },

  updateChecklist: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      checklists: state.checklists.map((list) =>
        list.id === id ? { ...list, ...updates, updatedAt: Date.now() } : list
      ),
    }));

    try {
      if (updates.title !== undefined) {
        await checklistRepo.updateTitle(id, updates.title);
      }
    } catch (e) {
      console.error("Failed to update checklist:", e);
      // Could revert state here
    }
  },

  deleteChecklist: async (id) => {
    // Optimistic update
    set((state) => ({
      checklists: state.checklists.filter((list) => list.id !== id),
      activeChecklistId:
        state.activeChecklistId === id ? null : state.activeChecklistId,
    }));

    try {
      await checklistRepo.delete(id);
    } catch (e) {
      console.error("Failed to delete checklist:", e);
    }
  },

  setActiveChecklist: (id) => set({ activeChecklistId: id }),

  // --- Checklist Items ---

  addItem: async (text) => {
    const activeId = get().activeChecklistId;
    if (!activeId) return;

    try {
      const newItem = await checklistItemRepo.add(activeId, text);
      set((state) => ({
        checklists: state.checklists.map((list) =>
          list.id === activeId
            ? {
                ...list,
                items: [
                  ...list.items,
                  newItem, // Use the item returned from repo (with correct ID)
                ],
                updatedAt: Date.now(),
              }
            : list
        ),
      }));
    } catch (e) {
      console.error("Failed to add item:", e);
    }
  },

  toggleItem: async (itemId) => {
    const activeId = get().activeChecklistId;
    if (!activeId) return;

    // Calculate new state for optimistic update
    const activeList = get().checklists.find((l) => l.id === activeId);
    if (!activeList) return;
    const item = activeList.items.find((i) => i.id === itemId);
    if (!item) return;
    const newCompleted = !item.completed;

    // Optimistic update
    set((state) => ({
      checklists: state.checklists.map((list) =>
        list.id === activeId
          ? {
              ...list,
              items: list.items.map((i) =>
                i.id === itemId ? { ...i, completed: newCompleted } : i
              ),
              updatedAt: Date.now(),
            }
          : list
      ),
    }));

    try {
      await checklistItemRepo.toggle(itemId, newCompleted);
    } catch (e) {
      console.error("Failed to toggle item:", e);
    }
  },

  deleteItem: async (itemId) => {
    const activeId = get().activeChecklistId;
    if (!activeId) return;

    // Optimistic update
    set((state) => ({
      checklists: state.checklists.map((list) =>
        list.id === activeId
          ? {
              ...list,
              items: list.items.filter((i) => i.id !== itemId),
              updatedAt: Date.now(),
            }
          : list
      ),
    }));

    try {
      await checklistItemRepo.delete(itemId);
    } catch (e) {
      console.error("Failed to delete item:", e);
    }
  },

  updateItemText: async (itemId, text) => {
    const activeId = get().activeChecklistId;
    if (!activeId) return;

    // Optimistic update
    set((state) => ({
      checklists: state.checklists.map((list) =>
        list.id === activeId
          ? {
              ...list,
              items: list.items.map((i) =>
                i.id === itemId ? { ...i, text } : i
              ),
              updatedAt: Date.now(),
            }
          : list
      ),
    }));

    try {
      await checklistItemRepo.updateText(itemId, text);
    } catch (e) {
      console.error("Failed to update item text:", e);
    }
  },

  // --- Notes ---

  createNote: async () => {
    const state = get();
    // Check if the most recent note is "empty"
    const recent = state.notes[0];
    if (recent && recent.title === "New Note" && recent.content === "") {
        set({ activeNoteId: recent.id });
        return;
    }

    try {
      const newNote = await noteRepo.create("New Note");
      set((state) => ({
        notes: [newNote, ...state.notes],
        activeNoteId: newNote.id,
      }));
    } catch (e) {
      console.error("Failed to create note:", e);
    }
  },

  updateNote: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
      ),
    }));

    try {
      await noteRepo.update(id, updates);
    } catch (e) {
      console.error("Failed to update note:", e);
    }
  },

  deleteNote: async (id) => {
    // Optimistic update
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
    }));

    try {
      await noteRepo.delete(id);
    } catch (e) {
      console.error("Failed to delete note:", e);
    }
  },

  setActiveNote: (id) => set({ activeNoteId: id }),
}));