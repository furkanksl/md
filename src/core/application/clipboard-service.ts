import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { ClipboardRepository } from "../infra/repositories";

const repo = new ClipboardRepository();

export class ClipboardService {
  private lastContent: string = "";
  private intervalId: NodeJS.Timeout | null = null;

  async getHistory() {
    return await repo.getAll();
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
