import { ConversationRepository, MessageRepository, FolderRepository } from "../infra/repositories";
import { getProvider } from "../infra/ai/provider-factory";
import { streamText } from "ai";
import { Message } from "../domain/entities";
import { getModelById } from "../domain/models";
import { v4 as uuidv4 } from "uuid";

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

  async sendMessage(
    conversationId: string, 
    content: string, 
    attachments: any[], 
    modelId: string, 
    providerId: string, 
    apiKey: string,
    previousMessages: any[],
    abortSignal?: AbortSignal
  ) {
    // 1. Validation
    const model = getModelById(modelId);
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
      timestamp: new Date()
    };
    await msgRepo.create(userMsg);

    // 3. Setup AI
    const provider = getProvider(providerId, apiKey);
    
    // 4. Sanitize History
    const sanitizedHistory = previousMessages.map(msg => {
        // If it's already a string, it's safe
        if (typeof msg.content === 'string') return { role: msg.role, content: msg.content };
        
        // If it's an array, we must clean it
        if (Array.isArray(msg.content)) {
             let validParts = msg.content.filter((part: any) => {
                 // Keep text
                 if (part.type === 'text') return true;
                 // Keep images ONLY if model supports them
                 if (part.type === 'image') return model.capabilities.image;
                 return false;
             });

             // If nothing remains (e.g. only image sent to text model), add placeholder
             if (validParts.length === 0) {
                 validParts = [{ type: 'text', text: '[Image not supported by current model]' }];
             }

             // SIMPLIFY: If it's just one text part, convert to string
             // This solves "unsupported content types" for many providers that expect string for simple messages
             if (validParts.length === 1 && validParts[0].type === 'text') {
                 return { role: msg.role, content: validParts[0].text };
             }
             
             return { role: msg.role, content: validParts };
        }
        
        // Fallback for unknown structures: try to extract text or stringify
        return { role: msg.role, content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) };
    });

    // 5. Prepare New Message
    let currentContent: any = content;
    
    if (attachments.length > 0) {
        const contentParts: any[] = [{ type: 'text', text: content }];
        attachments.forEach(a => {
            contentParts.push({
                type: 'image',
                image: a.base64 || a.path,
            });
        });
        currentContent = contentParts;
    }

    const messagesPayload = [...sanitizedHistory, { role: "user", content: currentContent }];

    // console.log("Sending Payload to AI:", JSON.stringify(messagesPayload, null, 2)); // Debug
    
    const result = await streamText({
      model: provider(modelId) as any,
      messages: messagesPayload,
      abortSignal,
      onFinish: async ({ text }: any) => {
        const assistantMsg: Message = {
          id: uuidv4(),
          conversationId,
          role: "assistant",
          content: text,
          attachments: [],
          timestamp: new Date()
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
    abortSignal?: AbortSignal
  ) {
    // 1. Get Message
    const msg = await msgRepo.getById(messageId);
    if (!msg) throw new Error("Message not found");

    // 2. Update Content
    await msgRepo.updateContent(messageId, newContent);

    // 3. Delete subsequent history
    await msgRepo.deleteAfterTimestamp(conversationId, msg.timestamp as Date);

    // 4. Get updated history
    const allMessages = await msgRepo.getByConversation(conversationId);
    
    // The last message is the one we just edited.
    // We need to stream the assistant response based on this history.
    const currentMsg = allMessages[allMessages.length - 1];
    if (!currentMsg) throw new Error("Conversation is empty or message not found");

    const previousMessages = allMessages.slice(0, -1);

    // 5. Validation (Same as sendMessage)
    const model = getModelById(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    if (currentMsg.attachments.length > 0 && !model.capabilities.image) {
      throw new Error(`The selected model (${model.name}) does not support images.`);
    }

    // 6. Setup AI
    const provider = getProvider(providerId, apiKey);

    // 7. Sanitize History (Same logic as sendMessage)
    const sanitizedHistory = previousMessages.map(msg => {
        if (typeof msg.content === 'string') return { role: msg.role, content: msg.content };
        if (Array.isArray(msg.content)) {
             let validParts = (msg.content as any[]).filter((part: any) => {
                 if (part.type === 'text') return true;
                 if (part.type === 'image') return model.capabilities.image;
                 return false;
             });
             if (validParts.length === 0) validParts = [{ type: 'text', text: '[Image not supported]' }];
             if (validParts.length === 1 && validParts[0].type === 'text') {
                 return { role: msg.role, content: validParts[0].text };
             }
             return { role: msg.role, content: validParts };
        }
        return { role: msg.role, content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) };
    });

    // 8. Prepare Current Message Payload
    let currentContent: any = newContent;
    // If it has attachments, rebuild the content array
    if (currentMsg.attachments && currentMsg.attachments.length > 0) {
        const contentParts: any[] = [{ type: 'text', text: newContent }];
        currentMsg.attachments.forEach(a => {
            contentParts.push({
                type: 'image',
                image: a.base64 || a.path,
            });
        });
        currentContent = contentParts;
    }

    const messagesPayload = [...sanitizedHistory, { role: "user", content: currentContent }];

    const result = await streamText({
      model: provider(modelId) as any,
      messages: messagesPayload as any, // Cast to any to avoid complex union type issues with AI SDK
      abortSignal,
      onFinish: async ({ text }: any) => {
        const assistantMsg: Message = {
          id: uuidv4(),
          conversationId,
          role: "assistant",
          content: text,
          attachments: [],
          timestamp: new Date()
        };
        await msgRepo.create(assistantMsg);
      }
    });

    return result;
  }

  async deleteConversation(id: string) {
    await convRepo.delete(id);
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

  async renameConversation(id: string, title: string) {
    await convRepo.updateTitle(id, title);
  }

  async updateConversationModel(id: string, modelId: string, providerId: string) {
    // We need to add this method to repo or just execute raw SQL here via client if repo doesn't support
    // For clean architecture, let's assume we add it to repo. But for speed now, I'll access repo's db.
    // Actually, I should update the repo.
    await convRepo.updateModel(id, modelId, providerId);
  }

  async rewindConversation(conversationId: string, messageId: string) {
    const msg = await msgRepo.getById(messageId);
    if (!msg) throw new Error("Message not found");
    await msgRepo.deleteFromTimestamp(conversationId, msg.timestamp as Date);
  }
}

export const chatService = new ChatService();
