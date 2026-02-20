import { ConversationRepository, MessageRepository, FolderRepository } from "../infra/repositories";
import { getProvider } from "../infra/ai/provider-factory";
import { streamText, LanguageModel, ImagePart, TextPart } from "ai";
import { Message, Attachment } from "@/core/domain/entities";
import { getModelById } from "../domain/models";
import { v4 as uuidv4 } from "uuid";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { estimateTokens } from "@/lib/utils";

// Define CoreMessage locally if not exported from 'ai' or for strict control
interface CoreMessage {
    role: "user" | "assistant" | "system";
    content: string | Array<TextPart | ImagePart>;
}

const convRepo = new ConversationRepository();
const msgRepo = new MessageRepository();
const folderRepo = new FolderRepository();

export class ChatService {
  async getSidebarData() {
    const folders = await folderRepo.getAll();
    const conversations = await convRepo.getAll();
    return { folders, conversations };
  }

  async getMessages(conversationId: string) {
    return await msgRepo.getByConversation(conversationId);
  }

  async createConversation(title: string, modelId: string, providerId: string) {
    return await convRepo.create(title, modelId, providerId);
  }

  async saveMessageToDb(message: Message) {
    await msgRepo.create(message);
  }

  async deleteConversation(id: string) {
    await convRepo.delete(id);
  }

  async renameConversation(id: string, title: string) {
    await convRepo.updateTitle(id, title);
  }

  async updateConversationModel(id: string, modelId: string, providerId: string) {
    await convRepo.updateModel(id, modelId, providerId);
  }

  async moveChatToFolder(chatId: string, folderId: string | null) {
    await convRepo.updateFolder(chatId, folderId);
  }

  async createFolder(name: string) {
    return await folderRepo.create(name);
  }

  async deleteFolder(id: string) {
    await folderRepo.delete(id);
  }

  async renameFolder(id: string, name: string) {
    await folderRepo.rename(id, name);
  }

  async rewindConversation(conversationId: string, messageId: string) {
    const msg = await msgRepo.getById(messageId);
    if (!msg) throw new Error("Message not found");
    await msgRepo.deleteFromTimestamp(conversationId, new Date(msg.timestamp));
  }

  // TODO:openai still cannot do web search, need to fix this
  private _prepareTools(providerId: string, enableWebSearch?: boolean) {
    let tools: any = undefined;
    if (enableWebSearch) {
        tools = {};
        
        if (providerId === 'anthropic') {
            try {
                // @ts-ignore
                if (anthropic.tools && anthropic.tools.webSearch_20250305) {
                     // @ts-ignore
                     tools.web_search = anthropic.tools.webSearch_20250305();
                }
            } catch (e) {
                console.warn("Failed to load Anthropic web search tool", e);
            }
        }
        
        if (providerId === 'openai') {
            try {
                // @ts-ignore
                if (openai.tools && openai.tools.webSearch) {
                    // Use 'webSearch' key for OpenAI as per docs and enable external access explicitly
                    // @ts-ignore
                    tools.webSearch = openai.tools.webSearch({ externalWebAccess: true });
                }
            } catch (e) {
                console.warn("Failed to load OpenAI web search tool", e);
            }
        }
    }
    return tools;
  }

  async sendMessage(
    conversationId: string, 
    content: string, 
    attachments: Attachment[], 
    modelId: string, 
    providerId: string, 
    apiKey: string,
    previousMessages: CoreMessage[],
    abortSignal?: AbortSignal,
    customModelConfig?: { baseUrl: string; modelId: string },
    enableWebSearch?: boolean
  ) {
    // 1. Validation
    let model = getModelById(modelId);
    
    // If not found in static list, check if it's a custom model configuration
    if (!model && providerId === 'custom' && customModelConfig) {
        model = {
            id: modelId,
            name: customModelConfig.modelId, // Use the API model ID as name or passed name
            provider: 'custom',
            capabilities: { image: false, audio: false, tools: false }, // Assume basic capabilities for custom
            contextWindow: 128000 // Default context window for custom models
        };
    }

    if (!model) {
        throw new Error(`Model ${modelId} not found`);
    }

    if (attachments.length > 0 && !model.capabilities.image) {
      throw new Error(`The selected model (${model.name}) does not support images.`);
    }

    // 2. Save User Message
    const userMsg: Message = {
      id: uuidv4(),
      conversationId,
      role: "user",
      content,
      attachments,
      timestamp: new Date().toISOString(),
      status: "completed",
      metadata: {
        tokenCount: estimateTokens(content),
      }
    };
    await msgRepo.create(userMsg);

    // 3. Setup AI
    const providerFn = getProvider(providerId, apiKey, { 
        baseUrl: customModelConfig?.baseUrl,
        enableWebSearch
    });
    
    // 4. Sanitize History
    // Filter out messages that have been compacted, we only send the summaries and recent messages
    const activeMessages = previousMessages.filter(msg => !(msg as any).metadata?.isCompacted);
    
    const sanitizedHistory: CoreMessage[] = activeMessages.map(msg => {
        // If it's already a string, it's safe
        if (typeof msg.content === 'string') return { role: msg.role, content: msg.content };
        
        // If it's an array, we must clean it
        if (Array.isArray(msg.content)) {
             let validParts = msg.content.filter((part: TextPart | ImagePart) => {
                 // Keep text
                 if (part.type === 'text') return true;
                 // Keep images ONLY if model supports them
                 if (part.type === 'image') return model!.capabilities.image;
                 return false;
             });

             // If nothing remains (e.g. only image sent to text model), add placeholder
             if (validParts.length === 0) {
                 validParts = [{ type: 'text', text: '[Image not supported by current model]' }];
             }

             // SIMPLIFY: If it's just one text part, convert to string
             // This solves "unsupported content types" for many providers that expect string for simple messages
             if (validParts.length === 1 && validParts[0]!.type === 'text') {
                 return { role: msg.role, content: (validParts[0] as TextPart).text };
             }
             
             return { role: msg.role, content: validParts };
        }
        
        // Fallback for unknown structures: try to extract text or stringify
        return { role: msg.role, content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) };
    });

    // 5. Apply Sliding Window Compression if necessary
    const targetModelId = customModelConfig?.modelId || modelId;
    const totalTokens = sanitizedHistory.reduce((acc, msg) => acc + (msg as any).metadata?.tokenCount || 0, 0) + estimateTokens(content);
    const maxTokens = targetModelId ? (getModelById(targetModelId)?.contextWindow || 128000) : 128000;
    
    let activeHistory = sanitizedHistory;
    
    // If over 85% capacity, keep system prompt + last 10 messages, replace middle with a placeholder
    if (totalTokens > maxTokens * 0.85 && sanitizedHistory.length > 10) {
        console.warn(`Context near limit (${totalTokens}/${maxTokens}). Applying sliding window compression.`);
        const systemPrompts = sanitizedHistory.filter(m => m.role === 'system');
        const recentMessages = sanitizedHistory.slice(-10);
        
        activeHistory = [
            ...systemPrompts,
            { role: 'assistant', content: '[... earlier messages omitted automatically to preserve context window ...]' },
            ...recentMessages
        ];
    }

    // 6. Prepare New Message
    let currentContent: string | Array<TextPart | ImagePart> = content;
    
    if (attachments.length > 0) {
        const contentParts: Array<TextPart | ImagePart> = [{ type: 'text', text: content }];
        attachments.forEach(a => {
            if (a.base64 || a.path) {
                contentParts.push({
                    type: 'image',
                    image: (a.base64 || a.path)!,
                });
            }
        });
        currentContent = contentParts;
    }

    const messagesPayload: CoreMessage[] = [...activeHistory, { role: "user", content: currentContent }];

    // Explicitly use .chat() if available (common for OpenAI-compatible providers)
    // This avoids issues where the default resolution might pick the wrong endpoint style
    const providerInstance = providerFn as unknown as { chat: (id: string) => LanguageModel };
    const modelInstance = providerInstance.chat ? providerInstance.chat(targetModelId) : providerFn(targetModelId);

    const tools = this._prepareTools(providerId, enableWebSearch);

    const result = await streamText({
      model: modelInstance,
      messages: messagesPayload as any, // Cast to any to avoid complex union type issues with AI SDK (CoreMessage mismatch)
      abortSignal,
      tools,
      onFinish: async ({ text }) => {
        const assistantMsg: Message = {
          id: uuidv4(),
          conversationId,
          role: "assistant",
          content: text,
          attachments: [],
          timestamp: new Date().toISOString(),
          status: "completed",
          metadata: {
            tokenCount: estimateTokens(text),
            model: targetModelId
          }
        };
        await msgRepo.create(assistantMsg);
      }
    });

    return result;
  }

  async editMessage(
    messageId: string,
    newContent: string,
    conversationId: string,
    modelId: string,
    providerId: string,
    apiKey: string,
    abortSignal?: AbortSignal,
    customModelConfig?: { baseUrl: string; modelId: string },
    recoveryMessage?: Message,
    enableWebSearch?: boolean
  ) {
    // 1. Get Message
    let msg = await msgRepo.getById(messageId);
    
    // Recovery mechanism for messages in store but not in DB
    if (!msg && recoveryMessage) {
        console.warn(`Message ${messageId} not found in DB. Recovering from store state.`);
        // Ensure it's associated with the correct conversation
        if (recoveryMessage.conversationId !== conversationId) {
            console.error("Recovery message mismatch conversationId");
        } else {
             await msgRepo.create(recoveryMessage);
             msg = await msgRepo.getById(messageId);
        }
    }

    if (!msg) throw new Error("Message not found");

    // 2. Update Content
    await msgRepo.updateContent(messageId, newContent);

    // 3. Delete subsequent history
    // Ensure timestamp is a Date object or string as expected by repo
    await msgRepo.deleteAfterTimestamp(conversationId, new Date(msg.timestamp));

    // 4. Get updated history
    const allMessages = await msgRepo.getByConversation(conversationId);
    
    // The last message is the one we just edited.
    // We need to stream the assistant response based on this history.
    const currentMsg = allMessages[allMessages.length - 1];
    if (!currentMsg) throw new Error("Conversation is empty or message not found");

    const previousMessages = allMessages.slice(0, -1);

    // 5. Validation (Same as sendMessage)
    let model = getModelById(modelId);
    if (!model && providerId === 'custom' && customModelConfig) {
        model = {
            id: modelId,
            name: customModelConfig.modelId,
            provider: 'custom',
            capabilities: { image: false, audio: false, tools: false },
            contextWindow: 128000
        };
    }
    if (!model) throw new Error(`Model ${modelId} not found`);
    
    if (currentMsg.attachments.length > 0 && !model.capabilities.image) {
      throw new Error(`The selected model (${model.name}) does not support images.`);
    }

    // 6. Setup AI
    const providerFn = getProvider(providerId, apiKey, { 
        baseUrl: customModelConfig?.baseUrl,
        enableWebSearch
    });

    // 7. Sanitize History (Same logic as sendMessage)
    // Filter out messages that have been compacted
    const activeMessages = previousMessages.filter(msg => !(msg as any).metadata?.isCompacted);
    
    const sanitizedHistory: CoreMessage[] = activeMessages.map(msg => {
        if (typeof msg.content === 'string') return { role: msg.role as any, content: msg.content };
        if (Array.isArray(msg.content)) {
             let validParts = (msg.content as any[]).filter((part: any) => {
                 if (part.type === 'text') return true;
                 if (part.type === 'image') return model!.capabilities.image;
                 return false;
             });
             if (validParts.length === 0) validParts = [{ type: 'text', text: '[Image not supported]' }];
             if (validParts.length === 1 && validParts[0].type === 'text') {
                 return { role: msg.role as any, content: validParts[0].text };
             }
             return { role: msg.role as any, content: validParts };
        }
        return { role: msg.role as any, content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) };
    });

    // 8. Apply Sliding Window Compression
    const targetModelId = customModelConfig?.modelId || modelId;
    const totalTokens = sanitizedHistory.reduce((acc, msg) => acc + (msg as any).metadata?.tokenCount || 0, 0) + estimateTokens(newContent);
    const maxTokens = targetModelId ? (getModelById(targetModelId)?.contextWindow || 128000) : 128000;
    
    let activeHistory = sanitizedHistory;
    
    if (totalTokens > maxTokens * 0.85 && sanitizedHistory.length > 10) {
        console.warn(`Context near limit (${totalTokens}/${maxTokens}). Applying sliding window compression.`);
        const systemPrompts = sanitizedHistory.filter(m => m.role === 'system');
        const recentMessages = sanitizedHistory.slice(-10);
        
        activeHistory = [
            ...systemPrompts,
            { role: 'assistant', content: '[... earlier messages omitted automatically to preserve context window ...]' },
            ...recentMessages
        ];
    }

    // 9. Prepare Current Message Payload
    let currentContent: string | Array<TextPart | ImagePart> = newContent;
    // If it has attachments, rebuild the content array
    if (currentMsg.attachments && currentMsg.attachments.length > 0) {
        const contentParts: Array<TextPart | ImagePart> = [{ type: 'text', text: newContent }];
        currentMsg.attachments.forEach(a => {
            if (a.base64 || a.path) {
                contentParts.push({
                    type: 'image',
                    image: (a.base64 || a.path)!,
                });
            }
        });
        currentContent = contentParts;
    }

    const messagesPayload: CoreMessage[] = [...activeHistory, { role: "user", content: currentContent }];

    const providerInstance = providerFn as unknown as { chat: (id: string) => LanguageModel };
    const modelInstance = providerInstance.chat ? providerInstance.chat(targetModelId) : providerFn(targetModelId);

    const tools = this._prepareTools(providerId, enableWebSearch);

    const result = await streamText({
      model: modelInstance,
      messages: messagesPayload as any, // Cast to any to avoid complex union type issues with AI SDK
      abortSignal,
      tools,
      onFinish: async ({ text }) => {
        const assistantMsg: Message = {
          id: uuidv4(),
          conversationId,
          role: "assistant",
          content: text,
          attachments: [],
          timestamp: new Date().toISOString(),
          status: "completed",
          metadata: {
            tokenCount: estimateTokens(text),
            model: targetModelId
          }
        };
        await msgRepo.create(assistantMsg);
      }
    });

    return result;
  }
  async compactConversation(
    conversationId: string,
    modelId: string,
    providerId: string,
    apiKey: string,
    customModelConfig?: { baseUrl: string; modelId: string }
  ) {
    const allMessages = await msgRepo.getByConversation(conversationId);
    if (allMessages.length < 2) return; // Nothing to compact

    // Skip already compacted messages if we wanted to be incremental, 
    // but here we just compact the entire visible history.
    const messagesToCompact = allMessages.filter(m => !m.metadata?.isSummary);

    if (messagesToCompact.length === 0) return;

    let model = getModelById(modelId);
    if (!model && providerId === 'custom' && customModelConfig) {
        model = {
            id: modelId,
            name: customModelConfig.modelId,
            provider: 'custom',
            capabilities: { image: false, audio: false, tools: false },
            contextWindow: 128000
        };
    }
    if (!model) throw new Error(`Model ${modelId} not found`);

    const providerFn = getProvider(providerId, apiKey, { 
        baseUrl: customModelConfig?.baseUrl,
        enableWebSearch: false // No need for web search during summarization
    });

    const targetModelId = customModelConfig?.modelId || modelId;
    const providerInstance = providerFn as unknown as { chat: (id: string) => LanguageModel };
    const modelInstance = providerInstance.chat ? providerInstance.chat(targetModelId) : providerFn(targetModelId);

    // Format for summarization
    const formattedHistory = messagesToCompact.map(m => {
        const textContent = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return `${m.role.toUpperCase()}: ${textContent}`;
    }).join('\n\n');

    const prompt = `Please summarize the following conversation history. Focus on retaining core facts, user preferences, code snippets, and the overall context so that an AI can use this summary to seamlessly continue the conversation. Do not include introductory filler, just output the dense summary.\n\n${formattedHistory}`;

    // Get the summary
    // Since we don't have generateText, we can use streamText and wait for it
    const result = await streamText({
        model: modelInstance,
        messages: [{ role: 'user', content: prompt }]
    });

    let summaryText = "";
    for await (const chunk of result.textStream) {
        summaryText += chunk;
    }

    // Mark old messages as compacted
    for (const m of messagesToCompact) {
        if (!m.metadata?.isCompacted) {
            await msgRepo.updateMetadata(m.id, { ...m.metadata, isCompacted: true });
        }
    }

    // Create a new assistant message with the summary to avoid "system messages only at beginning" errors with certain providers like Google
    const summaryMsg: Message = {
        id: uuidv4(),
        conversationId,
        role: "assistant",
        content: `[COMPACTED CONTEXT SUMMARY]\n${summaryText}`,
        attachments: [],
        timestamp: new Date().toISOString(),
        status: "completed",
        metadata: {
            isSummary: true,
            tokenCount: estimateTokens(summaryText)
        }
    };
    await msgRepo.create(summaryMsg);
  }
}

export const chatService = new ChatService();