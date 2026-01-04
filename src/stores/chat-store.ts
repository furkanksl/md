import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Conversation, Message } from "@/types/ai";
import { v4 as uuidv4 } from "uuid";

interface Folder {
  id: string;
  name: string;
  conversationIds: string[];
}

interface ChatState {
  conversations: Record<string, Conversation>; // id -> conversation
  folders: Record<string, Folder>; // id -> folder
  
  // Ordered Lists
  folderOrder: string[]; // Order of folders at the top
  rootChatOrder: string[]; // Order of chats at the root level (below folders)

  activeConversationId: string | null;
  activeFolderId: string | null;
  input: string;
  isStreaming: boolean;
  selectedModel: string;

  // Actions
  setActiveConversationId: (id: string | null) => void;
  setInput: (input: string) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setSelectedModel: (model: string) => void;
  
  createConversation: (title?: string) => string;
  renameConversation: (id: string, newTitle: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  deleteConversation: (id: string) => void;
  
  createFolder: (name: string) => void;
  renameFolder: (id: string, newName: string) => void;
  deleteFolder: (id: string) => void;
  
  // DnD Actions
  reorderFolders: (newOrder: string[]) => void;
  reorderRootChats: (newOrder: string[]) => void;
  reorderFolderChats: (folderId: string, newOrder: string[]) => void;
  
  moveChatToFolder: (chatId: string, targetFolderId: string) => void;
  moveChatToRoot: (chatId: string) => void;
  
  // Migration/Sync
  syncStructure: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: {},
      folders: {},
      folderOrder: [],
      rootChatOrder: [],
      activeConversationId: null,
      activeFolderId: null,
      input: "",
      isStreaming: false,
      selectedModel: "gpt-4-turbo",

      setActiveConversationId: (id) => set({ activeConversationId: id }),
      setInput: (input) => set({ input }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      setSelectedModel: (model) => set({ selectedModel: model }),

      createConversation: (title) => {
        const id = uuidv4();
        const newConversation: Conversation = {
          id,
          title: title || "New Chat",
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          pinned: false,
        };
        set((state) => ({
          conversations: { ...state.conversations, [id]: newConversation },
          rootChatOrder: [id, ...state.rootChatOrder], // Add to top of root chats
          activeConversationId: id,
        }));
        return id;
      },

      renameConversation: (id, newTitle) =>
        set((state) => {
          const conversation = state.conversations[id];
          if (!conversation) return state;
          return {
            conversations: {
              ...state.conversations,
              [id]: { ...conversation, title: newTitle },
            },
          };
        }),

      addMessage: (conversationId, message) =>
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (!conversation) return state;
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conversation,
                messages: [...conversation.messages, message],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      deleteConversation: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.conversations;
          
          // Remove from root order
          const newRootChatOrder = state.rootChatOrder.filter(itemId => itemId !== id);

          // Remove from any folders
          const updatedFolders = { ...state.folders };
          Object.keys(updatedFolders).forEach(folderId => {
             updatedFolders[folderId] = {
                 ...updatedFolders[folderId]!,
                 conversationIds: updatedFolders[folderId]!.conversationIds.filter(cid => cid !== id)
             }
          });
          
          return {
            conversations: rest,
            rootChatOrder: newRootChatOrder,
            folders: updatedFolders,
            activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
          };
        }),

      createFolder: (name) => {
        const id = uuidv4();
        set((state) => ({
          folders: { ...state.folders, [id]: { id, name, conversationIds: [] } },
          folderOrder: [id, ...state.folderOrder],
        }));
      },

      renameFolder: (id, newName) =>
        set((state) => {
          const folder = state.folders[id];
          if (!folder) return state;
          return {
            folders: {
              ...state.folders,
              [id]: { ...folder, name: newName },
            },
          };
        }),

      deleteFolder: (id) =>
        set((state) => {
          const { [id]: folderToDelete, ...rest } = state.folders;
          const newFolderOrder = state.folderOrder.filter(fid => fid !== id);
          
          // Move contents back to root top
          const recoveredChats = folderToDelete ? folderToDelete.conversationIds : [];
          const newRootChatOrder = [...recoveredChats, ...state.rootChatOrder];

          return { 
              folders: rest,
              folderOrder: newFolderOrder,
              rootChatOrder: newRootChatOrder
          };
        }),

      reorderFolders: (newOrder) => set({ folderOrder: newOrder }),
      reorderRootChats: (newOrder) => set({ rootChatOrder: newOrder }),
      
      reorderFolderChats: (folderId, newOrder) => 
        set((state) => ({
            folders: {
                ...state.folders,
                [folderId]: {
                    ...state.folders[folderId]!,
                    conversationIds: newOrder
                }
            }
        })),

      moveChatToFolder: (chatId, targetFolderId) => 
        set((state) => {
            const updatedFolders = { ...state.folders };
            let updatedRootChatOrder = [...state.rootChatOrder];

            // 1. Remove from source (could be root or another folder)
            if (updatedRootChatOrder.includes(chatId)) {
                updatedRootChatOrder = updatedRootChatOrder.filter(id => id !== chatId);
            } else {
                // Check all folders
                Object.keys(updatedFolders).forEach(fid => {
                    if (updatedFolders[fid]!.conversationIds.includes(chatId)) {
                        updatedFolders[fid] = {
                            ...updatedFolders[fid]!,
                            conversationIds: updatedFolders[fid]!.conversationIds.filter(id => id !== chatId)
                        };
                    }
                });
            }

            // 2. Add to target folder
            if (updatedFolders[targetFolderId]) {
                // Add to top of folder
                updatedFolders[targetFolderId] = {
                    ...updatedFolders[targetFolderId]!,
                    conversationIds: [chatId, ...updatedFolders[targetFolderId]!.conversationIds]
                };
            }

            return {
                folders: updatedFolders,
                rootChatOrder: updatedRootChatOrder
            };
        }),

      moveChatToRoot: (chatId) => 
        set((state) => {
            const updatedFolders = { ...state.folders };
            let updatedRootChatOrder = [...state.rootChatOrder];

            // 1. Remove from source (folder)
            Object.keys(updatedFolders).forEach(fid => {
                if (updatedFolders[fid]!.conversationIds.includes(chatId)) {
                    updatedFolders[fid] = {
                        ...updatedFolders[fid]!,
                        conversationIds: updatedFolders[fid]!.conversationIds.filter(id => id !== chatId)
                    };
                }
            });

            // 2. Add to root (top)
            if (!updatedRootChatOrder.includes(chatId)) {
                updatedRootChatOrder = [chatId, ...updatedRootChatOrder];
            }

            return {
                folders: updatedFolders,
                rootChatOrder: updatedRootChatOrder
            };
        }),

      syncStructure: () => set((state) => {
          // One-time migration or fix for structure
          const folderIds = Object.keys(state.folders);
          const chatsInFolders = new Set(Object.values(state.folders).flatMap(f => f.conversationIds));
          const allChatIds = Object.keys(state.conversations);
          
          // Identify root chats (not in any folder)
          const actualRootChats = allChatIds.filter(id => !chatsInFolders.has(id));

          // Ensure folderOrder contains all folders
          const missingFolders = folderIds.filter(id => !state.folderOrder.includes(id));
          const cleanFolderOrder = state.folderOrder.filter(id => folderIds.includes(id)); // Remove stale
          
          // Ensure rootChatOrder contains all root chats
          const missingRootChats = actualRootChats.filter(id => !state.rootChatOrder.includes(id));
          const cleanRootChatOrder = state.rootChatOrder.filter(id => actualRootChats.includes(id)); // Remove stale/moved

          return {
              folderOrder: [...cleanFolderOrder, ...missingFolders],
              rootChatOrder: [...cleanRootChatOrder, ...missingRootChats]
          };
      }),
    }),
    {
      name: "chat-storage",
    }
  )
);
