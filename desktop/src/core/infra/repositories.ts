import { dbClient } from "./database-client";
import { Conversation, Message } from "../domain/entities";
import { Checklist, TodoItem, Note } from "@/stores/todo-store";
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

export class ClipboardRepository {
  async getAll(limit: number = 50): Promise<any[]> {
    const db = await dbClient.getDb();
    if (limit <= 0) {
        return await db.select("SELECT * FROM clipboard ORDER BY timestamp DESC");
    }
    return await db.select("SELECT * FROM clipboard ORDER BY timestamp DESC LIMIT $1", [limit]);
  }

  async create(content: string, sourceApp?: string): Promise<void> {
    const db = await dbClient.getDb();
    const id = uuidv4();
    await db.execute(
      "INSERT INTO clipboard (id, content, source_app, timestamp, character_count, pinned) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        id, 
        content, 
        sourceApp || null, 
        new Date().toISOString(), 
        content.length, 
        false
      ]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("DELETE FROM clipboard WHERE id = $1", [id]);
  }

  async clear(): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("DELETE FROM clipboard WHERE pinned = 0");
  }

  async prune(limit: number): Promise<void> {
    const db = await dbClient.getDb();
    // Keep the 'limit' most recent items (by timestamp), delete the rest (except pinned maybe? standard is strict limit usually, but safer to keep pinned)
    // Actually, simple query: DELETE FROM clipboard WHERE id NOT IN (SELECT id FROM clipboard ORDER BY timestamp DESC LIMIT $1) AND pinned = 0
    await db.execute(
        "DELETE FROM clipboard WHERE id NOT IN (SELECT id FROM clipboard ORDER BY timestamp DESC LIMIT $1) AND pinned = 0",
        [limit]
    );
  }
}

export class ChecklistRepository {
  async getAll(): Promise<Checklist[]> {
    const db = await dbClient.getDb();
    const lists = await db.select<any[]>("SELECT * FROM checklists ORDER BY updated_at DESC");
    
    // Fetch items for each list
    const result: Checklist[] = [];
    for (const list of lists) {
      const items = await db.select<any[]>(
        "SELECT * FROM checklist_items WHERE checklist_id = $1 ORDER BY completed ASC, created_at DESC", 
        [list.id]
      );
      
      result.push({
        id: list.id,
        title: list.title,
        updatedAt: new Date(list.updated_at).getTime(),
        items: items.map(item => ({
          id: item.id,
          text: item.text,
          completed: Number(item.completed) === 1,
          createdAt: new Date(item.created_at).getTime()
        }))
      });
    }
    return result;
  }

  async create(title: string = "Untitled"): Promise<Checklist> {
    const db = await dbClient.getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.execute(
      "INSERT INTO checklists (id, title, updated_at, created_at) VALUES ($1, $2, $3, $4)",
      [id, title, now, now]
    );

    return {
      id,
      title,
      items: [],
      updatedAt: new Date(now).getTime()
    };
  }

  async updateTitle(id: string, title: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute(
      "UPDATE checklists SET title = $1, updated_at = $2 WHERE id = $3",
      [title, new Date().toISOString(), id]
    );
  }

  async delete(id: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("DELETE FROM checklists WHERE id = $1", [id]);
  }
}

export class ChecklistItemRepository {
  async add(checklistId: string, text: string): Promise<TodoItem> {
    const db = await dbClient.getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.execute(
      "INSERT INTO checklist_items (id, checklist_id, text, completed, created_at) VALUES ($1, $2, $3, $4, $5)",
      [id, checklistId, text, 0, now]
    );

    // Touch parent checklist
    await db.execute("UPDATE checklists SET updated_at = $1 WHERE id = $2", [now, checklistId]);

    return {
      id,
      text,
      completed: false,
      createdAt: new Date(now).getTime()
    };
  }

  async toggle(id: string, completed: boolean): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("UPDATE checklist_items SET completed = $1 WHERE id = $2", [completed ? 1 : 0, id]);
  }

  async delete(id: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("DELETE FROM checklist_items WHERE id = $1", [id]);
  }

  async updateText(id: string, text: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("UPDATE checklist_items SET text = $1 WHERE id = $2", [text, id]);
  }
}

export class NoteRepository {
  async getAll(): Promise<Note[]> {
    const db = await dbClient.getDb();
    const rows = await db.select<any[]>("SELECT * FROM notes ORDER BY updated_at DESC");
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      updatedAt: new Date(r.updated_at).getTime()
    }));
  }

  async create(title: string = "Untitled"): Promise<Note> {
    const db = await dbClient.getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.execute(
      "INSERT INTO notes (id, title, content, updated_at, created_at) VALUES ($1, $2, $3, $4, $5)",
      [id, title, "", now, now]
    );

    return {
      id,
      title,
      content: "",
      updatedAt: new Date(now).getTime()
    };
  }

  async update(id: string, updates: Partial<Note>): Promise<void> {
    const db = await dbClient.getDb();
    const now = new Date().toISOString();
    
    if (updates.title !== undefined) {
      await db.execute("UPDATE notes SET title = $1, updated_at = $2 WHERE id = $3", [updates.title, now, id]);
    }
    
    if (updates.content !== undefined) {
      await db.execute("UPDATE notes SET content = $1, updated_at = $2 WHERE id = $3", [updates.content, now, id]);
    }
  }

  async delete(id: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("DELETE FROM notes WHERE id = $1", [id]);
  }
}

export class SettingsRepository {
  async get<T>(key: string): Promise<T | null> {
    const db = await dbClient.getDb();
    const rows = await db.select<any[]>("SELECT value FROM settings WHERE key = $1", [key]);
    if (rows.length === 0) return null;
    try {
      return JSON.parse(rows[0].value) as T;
    } catch {
      return rows[0].value as T; // Fallback for simple strings if not JSON
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await dbClient.getDb();
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    // Upsert (INSERT OR REPLACE)
    await db.execute(
      "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ($1, $2, $3)",
      [key, strValue, new Date().toISOString()]
    );
  }

  async delete(key: string): Promise<void> {
    const db = await dbClient.getDb();
    await db.execute("DELETE FROM settings WHERE key = $1", [key]);
  }
}
