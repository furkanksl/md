import { create } from "zustand";
import { chatService } from "@/core/application/chat-service";
import { Conversation, Message } from "@/core/domain/entities";
import { getModelById } from "@/core/domain/models";
import { useSettingsStore } from "./settings-store";
import { v4 as uuidv4 } from "uuid";

interface ChatState {
  // Data
  conversations: Record<string, Conversation>;
  folders: Record<string, any>;
  messages: Message[];
  folderOrder: string[];
  rootChatOrder: string[];
  
  // UI State
  activeConversationId: string | null;
  input: string;
  selectedModelId: string;
  isStreaming: boolean;
  abortController: AbortController | null;
  
  // Actions
  setInput: (v: string) => void;
  setSelectedModelId: (v: string) => void;
  setActiveConversationId: (id: string | null) => Promise<void>;
  
  // Async Actions
  syncStructure: () => Promise<void>;
  createConversation: () => Promise<void>;
  sendMessage: (content: string, attachments: any[]) => Promise<void>;
  stopGeneration: () => void;
  
  // Organization
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  moveChatToFolder: (chatId: string, folderId: string | null) => Promise<void>;
  moveChatToRoot: (chatId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  reorderFolders: (order: string[]) => void;
  reorderRootChats: (order: string[]) => void;
  reorderFolderChats: (folderId: string, order: string[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: {},
  folders: {},
  messages: [],
  folderOrder: [],
  rootChatOrder: [],
  activeConversationId: null,
  input: "",
  selectedModelId: "gpt-5.2",
  isStreaming: false,
  abortController: null,

  setInput: (v) => set({ input: v }),
  setSelectedModelId: (v) => set({ selectedModelId: v }),
  
  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
        abortController.abort();
        set({ isStreaming: false, abortController: null });
    }
  },

  setActiveConversationId: async (id) => {
    set({ activeConversationId: id, messages: [] });
    if (id) {
        const msgs = await chatService.getMessages(id);
        const conv = get().conversations[id];
        set({ messages: msgs, selectedModelId: conv?.modelId || "gpt-5.2" });
    }
  },

  syncStructure: async () => {
    const { folders, conversations } = await chatService.getSidebarData();
    
    const folderMap: Record<string, any> = {};
    const folderOrder: string[] = [];
    
    folders.forEach((f: any) => {
      folderMap[f.id] = { ...f, conversationIds: [] };
      folderOrder.push(f.id);
    });

    const convMap: Record<string, any> = {};
    const rootChats: string[] = [];

    conversations.forEach((c: Conversation) => {
      convMap[c.id] = c;
      if (c.folderId && folderMap[c.folderId]) {
        folderMap[c.folderId].conversationIds.push(c.id);
      } else {
        rootChats.push(c.id);
      }
    });

    set({
      folders: folderMap,
      conversations: convMap,
      folderOrder,
      rootChatOrder: rootChats
    });
  },

  createConversation: async () => {
    const model = getModelById(get().selectedModelId || "gpt-5.2");
    if (!model) return;
    const c = await chatService.createConversation("New Chat", model.id, model.provider);
    set(state => ({
      conversations: { ...state.conversations, [c.id]: c },
      rootChatOrder: [c.id, ...state.rootChatOrder],
      activeConversationId: c.id,
      messages: []
    }));
  },

  createFolder: async (name) => {
    const id = await chatService.createFolder(name);
    set(state => ({
      folders: { ...state.folders, [id]: { id, name, conversationIds: [] } },
      folderOrder: [...state.folderOrder, id]
    }));
  },

  deleteFolder: async (id) => {
    await chatService.deleteFolder(id);
    get().syncStructure();
  },

  renameFolder: async (id, name) => {
    await chatService.renameFolder(id, name);
    set(state => ({
      folders: { ...state.folders, [id]: { ...state.folders[id], name } }
    }));
  },

  deleteConversation: async (id) => {
    await chatService.deleteConversation(id);
    if (get().activeConversationId === id) {
        set({ activeConversationId: null, messages: [] });
    }
    get().syncStructure();
  },

  renameConversation: async (id, title) => {
    await chatService.renameConversation(id, title);
    set(state => {
      const conv = state.conversations[id];
      if (!conv) return state;
      return {
        conversations: { ...state.conversations, [id]: { ...conv, title } }
      } as any;
    });
  },

  moveChatToFolder: async (chatId, folderId) => {
    await chatService.moveChatToFolder(chatId, folderId);
    get().syncStructure();
  },

  moveChatToRoot: async (chatId) => {
    await chatService.moveChatToFolder(chatId, null);
    get().syncStructure();
  },

  editMessage: async (messageId, newContent) => {
      const { activeConversationId, selectedModelId, messages } = get();
      if (!activeConversationId) return;

      const model = getModelById(selectedModelId);
      if (!model) return;

      const settings = useSettingsStore.getState();
      const config = settings.aiConfigurations[model.provider];
      
      if (!config?.apiKey) {
          throw new Error(`API Key for ${model.provider} is missing.`);
      }

      // 1. Locate message
      const msgIndex = messages.findIndex(m => m.id === messageId);
      if (msgIndex === -1) return;

      // 2. Truncate History & Update Content (Optimistic)
      const truncatedMessages = messages.slice(0, msgIndex + 1);
      truncatedMessages[msgIndex] = { ...truncatedMessages[msgIndex], content: newContent } as any;

      // 3. Prepare Assistant Placeholder
      const assistantId = uuidv4();
      const assistantMsg: Message = {
          id: assistantId,
          conversationId: activeConversationId,
          role: "assistant",
          content: "",
          attachments: [],
          timestamp: new Date()
      };

      const controller = new AbortController();

      set({
          messages: [...truncatedMessages, assistantMsg],
          isStreaming: true,
          abortController: controller
      });

      try {
          const streamResult = await chatService.editMessage(
              messageId,
              newContent,
              activeConversationId,
              selectedModelId,
              model.provider,
              config.apiKey,
              controller.signal
          );

          let fullText = "";
          for await (const chunk of streamResult.textStream) {
              fullText += chunk;
              set(state => ({
                  messages: state.messages.map(m => 
                      m.id === assistantId ? { ...m, content: fullText } : m
                  )
              }));
          }
      } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
              console.log("Generation aborted");
              set(state => {
                  const msgs = state.messages.map(m => {
                      if (m.id === assistantId) {
                          return { 
                              ...m, 
                              content: m.content ? `${m.content} [Stopped]` : "Request Cancelled" 
                          };
                      }
                      return m;
                  });
                  const finalMsg = msgs.find(m => m.id === assistantId);
                  if (finalMsg) {
                      chatService.saveMessageToDb(finalMsg).catch(console.error);
                  }
                  return { messages: msgs };
              });
          } else {
              console.error("Edit Error:", err);
              set(state => ({
                  messages: state.messages.map(m => 
                      m.id === assistantId ? { ...m, content: `Error: ${err instanceof Error ? err.message : String(err)}` } : m
                  )
              }));
          }
      } finally {
          set({ isStreaming: false, abortController: null });
      }
  },

  reorderFolders: (order) => set({ folderOrder: order }),
  reorderRootChats: (order) => set({ rootChatOrder: order }),
  reorderFolderChats: (fid, order) => set(state => ({
    folders: { ...state.folders, [fid]: { ...state.folders[fid], conversationIds: order } }
  })),

  sendMessage: async (content, attachments) => {
    let { activeConversationId, selectedModelId, messages } = get();
    
    // Auto-create chat if none active
    if (!activeConversationId) {
        await get().createConversation();
        // Refresh state after creation
        const newState = get();
        activeConversationId = newState.activeConversationId;
        messages = newState.messages;
        
        if (!activeConversationId) return; // Should not happen
    }

    const model = getModelById(selectedModelId);
    if (!model) return;

    const settings = useSettingsStore.getState();
    const config = settings.aiConfigurations[model.provider];
    
    if (!config?.apiKey) {
        throw new Error(`API Key for ${model.provider} is missing. Please add it in Settings.`);
    }

    // 1. Optimistic Update (User Message)
    const userMsg: Message = {
        id: uuidv4(),
        conversationId: activeConversationId,
        role: "user",
        content,
        attachments,
        timestamp: new Date()
    };

    // 2. Prepare Assistant Placeholder
    const assistantId = uuidv4();
    const assistantMsg: Message = {
        id: assistantId,
        conversationId: activeConversationId,
        role: "assistant",
        content: "",
        attachments: [],
        timestamp: new Date()
    };

    const controller = new AbortController();
    set({ 
        messages: [...messages, userMsg, assistantMsg],
        isStreaming: true,
        abortController: controller
    });

    try {
        const streamResult = await chatService.sendMessage(
            activeConversationId,
            content,
            attachments,
            selectedModelId,
            model.provider,
            config.apiKey,
            messages.map(m => ({ role: m.role, content: m.content })),
            controller.signal
        );

        let fullText = "";
        for await (const chunk of streamResult.textStream) {
            fullText += chunk;
            set(state => ({
                messages: state.messages.map(m => 
                    m.id === assistantId ? { ...m, content: fullText } : m
                )
            }));
        }
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            console.log("Generation aborted");
            // If we have some text, keep it. If not, mark as cancelled.
            set(state => {
                const msgs = state.messages.map(m => {
                    if (m.id === assistantId) {
                        return { 
                            ...m, 
                            content: m.content ? `${m.content} [Stopped]` : "Request Cancelled" 
                        };
                    }
                    return m;
                });
                
                // Sync the partial/cancelled message to DB
                const finalMsg = msgs.find(m => m.id === assistantId);
                if (finalMsg) {
                    chatService.saveMessageToDb(finalMsg).catch(console.error);
                }
                return { messages: msgs };
            });
        } else {
            console.error("Chat Error:", err);
            set(state => ({
                messages: state.messages.map(m => 
                    m.id === assistantId ? { ...m, content: `Error: ${err instanceof Error ? err.message : String(err)}` } : m
                )
            }));
        }
    } finally {
        set({ isStreaming: false, abortController: null });
    }
  }
}));