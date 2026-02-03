import Database from "@tauri-apps/plugin-sql";

class DatabaseClient {
  private static instance: DatabaseClient;
  private db: Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  public async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await Database.load("sqlite:mydrawer.db");
      await this.initSchema();
    }
    return this.db;
  }

  private async initSchema() {
    if (!this.db) return;

    // 1. Folders
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Conversations
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        model_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        folder_id TEXT,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE SET NULL
      );
    `);

    // 3. Messages
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('system', 'user', 'assistant')),
        content TEXT NOT NULL,
        attachments TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );
    `);

    // 4. Checklists
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS checklists (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Checklist Items
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS checklist_items (
        id TEXT PRIMARY KEY,
        checklist_id TEXT NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
      );
    `);

    // 6. Notes
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        order_index INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Settings (Key-Value Store)
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- MIGRATIONS (Simple check-and-add) ---
    try {
        // Check for missing columns in conversations
        const convColumns = await this.db.select<any[]>("PRAGMA table_info(conversations)");
        const hasModelId = convColumns.some(c => c.name === 'model_id');
        
        if (!hasModelId) {
            console.log("Migrating conversations table...");
            await this.db.execute("ALTER TABLE conversations ADD COLUMN model_id TEXT DEFAULT 'gpt-4o'");
            await this.db.execute("ALTER TABLE conversations ADD COLUMN provider_id TEXT DEFAULT 'openai'");
            await this.db.execute("ALTER TABLE conversations ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL");
            await this.db.execute("ALTER TABLE conversations ADD COLUMN order_index INTEGER DEFAULT 0");
        }

        // Check for missing columns in folders
        const folderColumns = await this.db.select<any[]>("PRAGMA table_info(folders)");
        const hasOrderIndex = folderColumns.some(c => c.name === 'order_index');
        
        if (!hasOrderIndex) {
             console.log("Migrating folders table...");
             await this.db.execute("ALTER TABLE folders ADD COLUMN order_index INTEGER DEFAULT 0");
        }

        // Check for missing columns in messages
        const msgColumns = await this.db.select<any[]>("PRAGMA table_info(messages)");
        const hasAttachments = msgColumns.some(c => c.name === 'attachments');
        
        if (!hasAttachments) {
             console.log("Migrating messages table...");
             await this.db.execute("ALTER TABLE messages ADD COLUMN attachments TEXT");
        }

    } catch (e) {
        console.error("Migration failed:", e);
    }
  }
}

export const dbClient = DatabaseClient.getInstance();
