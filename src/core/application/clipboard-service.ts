import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { ClipboardRepository } from "../infra/repositories";
import { useSettingsStore } from "@/stores/settings-store";

const repo = new ClipboardRepository();

export class ClipboardService {
  private lastContent: string = "";
  private intervalId: NodeJS.Timeout | null = null;

  async getHistory() {
    const limit = useSettingsStore.getState().clipboardHistoryLimit;
    return await repo.getAll(limit);
  }

  async startMonitoring(callback: () => void) {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      try {
        const content = await readText();
        // console.log("Clipboard read:", content?.substring(0, 20)); // Debug log
        
        if (content && content !== this.lastContent && content.trim() !== "") {
          console.log("New clipboard content detected:", content.substring(0, 50));
          this.lastContent = content;
          
          await repo.create(content, "System");
          
          // Cleanup old items based on limit
          const limit = useSettingsStore.getState().clipboardHistoryLimit;
          if (limit > 0) {
             // We can optimize this by doing it in the DB or periodically
             // For now, let's just rely on getHistory limiting the view, 
             // but ideally we should delete old records.
             // Let's add a prune method to repo?
             await repo.prune(limit);
          }

          callback(); 
        }
      } catch (e) {
        console.error("Clipboard read error:", e);
      }
    }, 1000);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async deleteItem(id: string) {
    await repo.delete(id);
  }

  async clearHistory() {
    await repo.clear();
  }
}

export const clipboardService = new ClipboardService();
