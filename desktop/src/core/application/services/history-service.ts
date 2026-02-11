import Database from "@tauri-apps/plugin-sql";
import { v4 as uuidv4 } from "uuid";

export interface WebHistoryEntry {
  id: string;
  url: string;
  title: string;
  timestamp: string;
}

export type HistoryFilter = "today" | "yesterday" | "last_week" | "last_month" | "all";

class HistoryService {
  private dbPromise: Promise<Database> | null = null;

  private async getDb(): Promise<Database> {
    if (!this.dbPromise) {
      this.dbPromise = Database.load("sqlite:mydrawer.db");
    }
    return this.dbPromise;
  }

  async addEntry(url: string, title: string): Promise<void> {
    const db = await this.getDb();
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    await db.execute(
      "INSERT INTO web_history (id, url, title, timestamp) VALUES ($1, $2, $3, $4)",
      [id, url, title, timestamp]
    );
  }

  async getHistory(filter: HistoryFilter): Promise<WebHistoryEntry[]> {
    const db = await this.getDb();
    let query = "SELECT * FROM web_history";
    const params: any[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case "today":
        query += " WHERE timestamp >= $1";
        params.push(todayStart.toISOString());
        break;
      case "yesterday": {
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        query += " WHERE timestamp >= $1 AND timestamp < $2";
        params.push(yesterdayStart.toISOString(), todayStart.toISOString());
        break;
      }
      case "last_week": {
        const lastWeekStart = new Date(todayStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        query += " WHERE timestamp >= $1";
        params.push(lastWeekStart.toISOString());
        break;
      }
      case "last_month": {
        const lastMonthStart = new Date(todayStart);
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        query += " WHERE timestamp >= $1";
        params.push(lastMonthStart.toISOString());
        break;
      }
      case "all":
      default:
        break;
    }

    query += " ORDER BY timestamp DESC";

    // Limit 'all' to prevent massive loads, user can clear or we can paginate later if needed
    if (filter === "all") {
        query += " LIMIT 1000";
    }

    return await db.select<WebHistoryEntry[]>(query, params);
  }

  async clearHistory(): Promise<void> {
    const db = await this.getDb();
    await db.execute("DELETE FROM web_history");
  }
}

export const historyService = new HistoryService();
