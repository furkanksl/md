import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

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
  // Checklists
  checklists: Checklist[];
  activeChecklistId: string | null;
  createChecklist: () => void;
  updateChecklist: (id: string, updates: Partial<Checklist>) => void;
  deleteChecklist: (id: string) => void;
  setActiveChecklist: (id: string | null) => void;

  // Checklist Items (operate on active checklist)
  addItem: (text: string) => void;
  toggleItem: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  updateItemText: (itemId: string, text: string) => void;

  // Notes (Scratchpads)
  notes: Note[];
  activeNoteId: string | null;
  createNote: () => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      // Checklists
      checklists: [],
      activeChecklistId: null,

      createChecklist: () => {
        const newChecklist: Checklist = {
          id: uuidv4(),
          title: "New List",
          items: [],
          updatedAt: Date.now(),
        };
        set((state) => ({
          checklists: [newChecklist, ...state.checklists],
          activeChecklistId: newChecklist.id,
        }));
      },

      updateChecklist: (id, updates) =>
        set((state) => ({
          checklists: state.checklists.map((list) =>
            list.id === id ? { ...list, ...updates, updatedAt: Date.now() } : list
          ),
        })),

      deleteChecklist: (id) =>
        set((state) => ({
          checklists: state.checklists.filter((list) => list.id !== id),
          activeChecklistId:
            state.activeChecklistId === id ? null : state.activeChecklistId,
        })),

      setActiveChecklist: (id) => set({ activeChecklistId: id }),

      // Checklist Items
      addItem: (text) =>
        set((state) => {
          const activeId = state.activeChecklistId;
          if (!activeId) return state;

          return {
            checklists: state.checklists.map((list) =>
              list.id === activeId
                ? {
                    ...list,
                    items: [
                      ...list.items,
                      {
                        id: uuidv4(),
                        text,
                        completed: false,
                        createdAt: Date.now(),
                      },
                    ],
                    updatedAt: Date.now(),
                  }
                : list
            ),
          };
        }),

      toggleItem: (itemId) =>
        set((state) => {
          const activeId = state.activeChecklistId;
          if (!activeId) return state;

          return {
            checklists: state.checklists.map((list) =>
              list.id === activeId
                ? {
                    ...list,
                    items: list.items.map((item) =>
                      item.id === itemId
                        ? { ...item, completed: !item.completed }
                        : item
                    ),
                    updatedAt: Date.now(),
                  }
                : list
            ),
          };
        }),

      deleteItem: (itemId) =>
        set((state) => {
          const activeId = state.activeChecklistId;
          if (!activeId) return state;

          return {
            checklists: state.checklists.map((list) =>
              list.id === activeId
                ? {
                    ...list,
                    items: list.items.filter((item) => item.id !== itemId),
                    updatedAt: Date.now(),
                  }
                : list
            ),
          };
        }),

      updateItemText: (itemId, text) =>
        set((state) => {
          const activeId = state.activeChecklistId;
          if (!activeId) return state;

          return {
            checklists: state.checklists.map((list) =>
              list.id === activeId
                ? {
                    ...list,
                    items: list.items.map((item) =>
                      item.id === itemId ? { ...item, text } : item
                    ),
                    updatedAt: Date.now(),
                  }
                : list
            ),
          };
        }),

      // Notes
      notes: [],
      activeNoteId: null,

      createNote: () => {
        const newNote: Note = {
          id: uuidv4(),
          title: "New Note",
          content: "",
          updatedAt: Date.now(),
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
        }));
      },

      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
          ),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        })),

      setActiveNote: (id) => set({ activeNoteId: id }),
    }),
    {
      name: "todo-storage-v2", // New storage key for new schema
      version: 1,
    }
  )
);