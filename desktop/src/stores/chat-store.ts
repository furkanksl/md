import { create } from "zustand";
import { chatService } from "@/core/application/chat-service";
import { Conversation, Message, Attachment } from "@/core/domain/entities";
import { getModelById, MODELS } from "@/core/domain/models";
import { useSettingsStore } from "./settings-store";
import { v4 as uuidv4 } from "uuid";
import { estimateTokens } from "@/lib/utils";

interface Folder {
    id: string;
    name: string;
    conversationIds: string[];
}

interface ChatState {
  // Data
  conversations: Record<string, Conversation>;
  folders: Record<string, Folder>;
  messages: Message[];
  folderOrder: string[];
  rootChatOrder: string[];
  
  // UI State
  activeConversationId: string | null;
  input: string;
  selectedModelId: string;
  isStreaming: boolean;
  isCompacting: boolean;
  abortController: AbortController | null;
  
  // Actions
  setInput: (v: string) => void;
  setSelectedModelId: (v: string) => Promise<void>;
  setActiveConversationId: (id: string | null) => Promise<void>;
  
  // Async Actions
  syncStructure: () => Promise<void>;
  createConversation: () => Promise<void>;
  sendMessage: (content: string, attachments: Attachment[]) => Promise<void>;
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
  rewind: (messageId: string) => Promise<void>;
  regenerate: (messageId: string) => Promise<void>;
  compactConversation: () => Promise<void>;
  reorderFolders: (order: string[]) => void;
  reorderRootChats: (order: string[]) => void;
  reorderFolderChats: (folderId: string, order: string[]) => void;
}

const resolveModel = (id: string) => {
    const standard = MODELS.find(m => m.id === id);
    if (standard) return { model: standard, customConfig: undefined };

    const settings = useSettingsStore.getState();
    const customModels = settings.aiConfigurations['custom']?.customModels || [];
    const foundCustom = customModels.find(m => m.id === id);
    
    if (foundCustom) {
        return {
            model: {
                id: foundCustom.id,
                name: foundCustom.name,
                provider: 'custom' as const,
                capabilities: { image: false, audio: false, tools: false, webSearch: false }
            },
            customConfig: {
                baseUrl: foundCustom.baseUrl,
                modelId: foundCustom.modelId
            }
        };
    }

    return { model: getModelById(id), customConfig: undefined };
};

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
  isCompacting: false,
  abortController: null,

  setInput: (v) => set({ input: v }),
  
  setSelectedModelId: async (v) => {
    set({ selectedModelId: v });
    const { activeConversationId, conversations } = get();
    if (activeConversationId) {
        const currentConv = conversations[activeConversationId];
        if (currentConv) {
            const { model } = resolveModel(v);
            if (model) {
                const updatedConv = { ...currentConv, modelId: v, providerId: model.provider };
                set({ conversations: { ...conversations, [activeConversationId]: updatedConv } });
                await chatService.updateConversationModel(activeConversationId, v, model.provider);
            }
        }
    }
  },
  
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
  
  rewind: async (messageId) => {
      const { activeConversationId, messages } = get();
      if (!activeConversationId) return;

      const msgIndex = messages.findIndex(m => m.id === messageId);
      if (msgIndex === -1) return;

      const newMessages = messages.slice(0, msgIndex);
      set({ messages: newMessages });

      await chatService.rewindConversation(activeConversationId, messageId);
  },

  regenerate: async (messageId) => {
      const { messages } = get();
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;
      await get().editMessage(messageId, typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content));
  },

  compactConversation: async () => {
      const { activeConversationId, messages, selectedModelId } = get();
      if (!activeConversationId || messages.length === 0) return;

      const { model, customConfig } = resolveModel(selectedModelId);
      if (!model) return;

      const settings = useSettingsStore.getState();
      const config = settings.aiConfigurations[model.provider];
      
      let apiKey = config?.apiKey;
      if (model.provider === 'custom' && customConfig) {
           const foundCustom = settings.aiConfigurations['custom']?.customModels?.find(m => m.id === selectedModelId);
           apiKey = foundCustom?.apiKey || apiKey || 'not-needed';
      }
      
      if (!apiKey) {
          throw new Error(`API Key for ${model.provider} is missing. Please add it in Settings.`);
      }

      set({ isCompacting: true });
      try {
          await chatService.compactConversation(
              activeConversationId,
              selectedModelId,
              model.provider,
              apiKey,
              customConfig
          );
          // Refresh messages from DB to get the updated status/flags if any
          const msgs = await chatService.getMessages(activeConversationId);
          set({ messages: msgs });
      } catch (err) {
          console.error("Compact Error:", err);
      } finally {
          set({ isCompacting: false });
      }
  },

  syncStructure: async () => {
    const { folders, conversations } = await chatService.getSidebarData();
    
    const folderMap: Record<string, Folder> = {};
    const folderOrder: string[] = [];
    
    folders.forEach((f: { id: string; name: string }) => {
      folderMap[f.id] = { ...f, conversationIds: [] };
      folderOrder.push(f.id);
    });

    const convMap: Record<string, Conversation> = {};
    const rootChats: string[] = [];

    conversations.forEach((c: Conversation) => {
      convMap[c.id] = c;
      if (c.folderId) {
          const folder = folderMap[c.folderId];
          if (folder) {
              folder.conversationIds.push(c.id);
          } else {
              rootChats.push(c.id);
          }
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
    const { model } = resolveModel(get().selectedModelId || "gpt-5.2");
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
    set(state => {
        const folder = state.folders[id];
        if (!folder) return {};
        return {
            folders: { ...state.folders, [id]: { ...folder, name } }
        };
    });
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
      };
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

      const { model, customConfig } = resolveModel(selectedModelId);
      if (!model) return;

      const settings = useSettingsStore.getState();
      const config = settings.aiConfigurations[model.provider];
      
      let apiKey = config?.apiKey;
      // Derive web search support directly from model capabilities
      let enableWebSearch = model.capabilities.webSearch;
      
      if (model.provider === 'custom' && customConfig) {
           const foundCustom = settings.aiConfigurations['custom']?.customModels?.find(m => m.id === selectedModelId);
           apiKey = foundCustom?.apiKey || apiKey || 'not-needed';
      }
      
      if (!apiKey) {
          throw new Error(`API Key for ${model.provider} is missing.`);
      }

      const msgIndex = messages.findIndex(m => m.id === messageId);
      if (msgIndex === -1) return;

      const truncatedMessages = messages.slice(0, msgIndex + 1);
      const targetMsg = truncatedMessages[msgIndex];
      const updatedMsg: Message = { ...targetMsg, content: newContent } as Message;
      truncatedMessages[msgIndex] = updatedMsg;

      const assistantId = uuidv4();
      const assistantMsg: Message = {
          id: assistantId,
          conversationId: activeConversationId,
          role: "assistant",
          content: "",
          attachments: [],
          timestamp: new Date().toISOString(),
          status: "pending",
          metadata: {
              tokenCount: 0,
              model: selectedModelId,
          }
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
              apiKey,
              controller.signal,
              customConfig,
              targetMsg,
              enableWebSearch
          );

          let fullText = "";
          for await (const chunk of streamResult.textStream) {
              fullText += chunk;
              set(state => ({
                  messages: state.messages.map(m => 
                      m.id === assistantId ? { 
                          ...m, 
                          content: fullText,
                          metadata: { ...m.metadata, tokenCount: estimateTokens(fullText) }
                      } : m
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
  reorderFolderChats: (fid, order) => set(state => {
      const folder = state.folders[fid];
      if (!folder) return {};
      return {
        folders: { ...state.folders, [fid]: { ...folder, conversationIds: order } }
      };
  }),

  sendMessage: async (content, attachments) => {
    let { activeConversationId, selectedModelId, messages } = get();
    
    if (!activeConversationId) {
        await get().createConversation();
        const newState = get();
        activeConversationId = newState.activeConversationId;
        messages = newState.messages;
        
        if (!activeConversationId) return; 
    }

    const { model, customConfig } = resolveModel(selectedModelId);
    if (!model) return;

    const settings = useSettingsStore.getState();
    const config = settings.aiConfigurations[model.provider];
    
    let apiKey = config?.apiKey;
    // Derive web search support directly from model capabilities
    let enableWebSearch = model.capabilities.webSearch;
    
    if (model.provider === 'custom' && customConfig) {
         const foundCustom = settings.aiConfigurations['custom']?.customModels?.find(m => m.id === selectedModelId);
         apiKey = foundCustom?.apiKey || apiKey || 'not-needed';
    }
    
    if (!apiKey) {
        throw new Error(`API Key for ${model.provider} is missing. Please add it in Settings.`);
    }

    const userMsg: Message = {
        id: uuidv4(),
        conversationId: activeConversationId,
        role: "user",
        content,
        attachments,
        timestamp: new Date().toISOString(),
        status: "completed",
        metadata: {
            tokenCount: estimateTokens(content),
        }
    };

    const assistantId = uuidv4();
    const assistantMsg: Message = {
        id: assistantId,
        conversationId: activeConversationId,
        role: "assistant",
        content: "",
        attachments: [],
        timestamp: new Date().toISOString(),
        status: "pending",
        metadata: {
            tokenCount: 0,
            model: selectedModelId,
        }
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
            apiKey,
            messages.map(m => ({ role: m.role, content: m.content })),
            controller.signal,
            customConfig,
            enableWebSearch
        );

        let fullText = "";
        for await (const chunk of streamResult.textStream) {
            fullText += chunk;
            set(state => ({
                messages: state.messages.map(m => 
                    m.id === assistantId ? { 
                        ...m, 
                        content: fullText,
                        metadata: { ...m.metadata, tokenCount: estimateTokens(fullText) }
                    } : m
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