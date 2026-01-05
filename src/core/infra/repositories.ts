import { dbClient } from "./database-client";
import { Conversation, Message } from "../domain/entities";
import { v4 as uuidv4 } from "uuid";

export class ConversationRepository {
  async getAll(): Promise<Conversation[]> {
    const db = await dbClient.getDb();
    const rows = await db.select<any[]>("SELECT * FROM conversations ORDER BY order_index ASC, updated_at DESC");
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      modelId: r.model_id,
      providerId: r.provider_id,
      folderId: r.folder_id,
      orderIndex: r.order_index,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at)
    }));
  }

  async create(title: string, modelId: string, providerId: string, folderId?: string): Promise<Conversation> {
    const db = await dbClient.getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
        await db.execute(
        "INSERT INTO conversations (id, title, model_id, provider_id, folder_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, title, modelId, providerId, folderId || null, now, now]
        );
    } catch (e) {
        console.error("Failed to create conversation in DB:", e);
        throw e;
    }

    return {
      id,
      title,
      modelId,
      providerId,
      folderId: folderId || null,
      orderIndex: 0,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async delete(id: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("DELETE FROM conversations WHERE id = $1", [id]);
  }

  async updateFolder(conversationId: string, folderId: string | null): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("UPDATE conversations SET folder_id = $1 WHERE id = $2", [folderId, conversationId]);
  }

  async updateTitle(id: string, title: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("UPDATE conversations SET title = $1 WHERE id = $2", [title, id]);
  }

  async updateModel(id: string, modelId: string, providerId: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("UPDATE conversations SET model_id = $1, provider_id = $2 WHERE id = $3", [modelId, providerId, id]);
  }
}

export class MessageRepository {
  async getByConversation(conversationId: string): Promise<Message[]> {
    const db = await dbClient.getDb();
    const rows = await db.select<any[]>("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC", [conversationId]);
    return rows.map(r => ({
      id: r.id,
      conversationId: r.conversation_id,
      role: r.role,
      content: r.content,
      attachments: JSON.parse(r.attachments || "[]"),
      timestamp: new Date(r.timestamp)
    }));
  }

  async getById(id: string): Promise<Message | null> {
    const db = await dbClient.getDb();
    const rows = await db.select<any[]>("SELECT * FROM messages WHERE id = $1", [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      conversationId: r.conversation_id,
      role: r.role,
      content: r.content,
      attachments: JSON.parse(r.attachments || "[]"),
      timestamp: new Date(r.timestamp)
    };
  }

  async create(message: Message): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute(
      "INSERT INTO messages (id, conversation_id, role, content, attachments, timestamp) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        message.id,
        message.conversationId,
        message.role,
        message.content,
        JSON.stringify(message.attachments),
        message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp
      ]
    );
  }

  async updateContent(id: string, content: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("UPDATE messages SET content = $1 WHERE id = $2", [content, id]);
  }

  async deleteAfterTimestamp(conversationId: string, timestamp: Date): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute(
        "DELETE FROM messages WHERE conversation_id = $1 AND timestamp > $2", 
        [conversationId, timestamp.toISOString()]
    );
  }
}

export class FolderRepository {
  async getAll(): Promise<any[]> {
    const db = await dbClient.getDb();
    return await db.select("SELECT * FROM folders ORDER BY order_index ASC");
  }

  async create(name: string): Promise<string> {
    const db = await dbClient.getDb();
    const id = uuidv4();
    await db.execute("INSERT INTO folders (id, name, created_at) VALUES ($1, $2, $3)", [id, name, new Date().toISOString()]);
    return id;
  }

  async delete(id: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("DELETE FROM folders WHERE id = $1", [id]);
  }

  async rename(id: string, name: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("UPDATE folders SET name = $1 WHERE id = $2", [name, id]);
  }
}
