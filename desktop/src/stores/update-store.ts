import { create } from 'zustand';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

interface UpdateStore {
  updateAvailable: boolean;
  posterVisible: boolean;
  version: string | null;
  body: string | null;
  manualDownloadUrl: string | null;
  isDownloading: boolean;
  downloadProgress: number | null;
  error: string | null;
  updateManifest: Update | null;
  
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  showPoster: () => void;
  testUpdate: () => void;
}

export const useUpdateStore = create<UpdateStore>((set, get) => ({
  updateAvailable: false,
  posterVisible: false,
  version: null,
  body: null,
  manualDownloadUrl: null,
  isDownloading: false,
  downloadProgress: null,
  error: null,
  updateManifest: null,

  testUpdate: () => {
    set({
      updateAvailable: true,
      posterVisible: true,
      version: "1.0.0-beta",
      body: "### Big Update!\n\n- Added cool new features\n- Fixed annoying bugs\n- Improved performance\n\nEnjoy!",
      updateManifest: {} as any, // Mock object
    });
  },

  showPoster: () => {
    set({ posterVisible: true });
  },

  checkForUpdates: async () => {
    try {
      const appendLog = async (message: string, data?: unknown) => {
        const line = `[${new Date().toISOString()}] ${message}${data ? ` ${JSON.stringify(data)}` : ""}\n`;
        try {
          await writeTextFile("updater.log", line, {
            append: true,
            baseDir: BaseDirectory.AppData,
          });
        } catch {
          // Ignore logging failures.
        }
      };

      const compareVersions = (a: string, b: string) => {
        const sanitize = (value: string) =>
          value.replace(/^v/i, "").split(".").map((part) => parseInt(part, 10) || 0);
        const aParts = sanitize(a);
        const bParts = sanitize(b);
        const maxLen = Math.max(aParts.length, bParts.length);
        for (let i = 0; i < maxLen; i += 1) {
          const diff = (aParts[i] || 0) - (bParts[i] || 0);
          if (diff !== 0) return diff;
        }
        return 0;
      };

      const resolveTargetKeys = () => {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes("arm64") || ua.includes("aarch64")) {
          return ["darwin-aarch64", "darwin-arm64", "aarch64-apple-darwin"];
        }
        if (ua.includes("x86_64") || ua.includes("x64") || ua.includes("intel")) {
          return ["darwin-x86_64", "darwin-x64", "x86_64-apple-darwin"];
        }
        return [];
      };

      const fallbackCheck = async () => {
        const endpoint = "https://github.com/furkanksl/md/releases/latest/download/latest.json";
        try {
          const res = await fetch(endpoint, { cache: "no-store" });
          if (!res.ok) {
            await appendLog("fallback:latest.json fetch failed", { status: res.status });
            return null;
          }
          const data = await res.json();
          const latestVersion = data?.version;
          if (!latestVersion) {
            await appendLog("fallback:latest.json missing version");
            return null;
          }
          const currentVersion = await getVersion();
          if (compareVersions(latestVersion, currentVersion) <= 0) {
            await appendLog("fallback:no update", { currentVersion, latestVersion });
            return null;
          }

          const targetKeys = resolveTargetKeys();
          const platforms = data?.platforms || {};
          const platformEntry =
            targetKeys.map((key) => platforms[key]).find(Boolean) ||
            platforms["darwin-aarch64"] ||
            platforms["darwin-arm64"] ||
            platforms["darwin-x86_64"] ||
            platforms["darwin-x64"];

          return {
            version: latestVersion,
            body: data?.notes || "A new update is available.",
            url: platformEntry?.url || data?.url || "https://github.com/furkanksl/md/releases/latest",
          };
        } catch (err: any) {
          await appendLog("fallback:error", { message: err?.message || "unknown" });
          return null;
        }
      };

      let update: Update | null = null;
      try {
        update = await check();
      } catch (e: any) {
        console.error('Failed to check for updates (native):', e);
        await appendLog("native:check failed", { error: e?.message || String(e) });
      }

      if (update && update.available) {
        let resolvedBody: string | null = null;
        let releaseFetchError: string | null = null;
        try {
          const withV = await fetch(
            `https://api.github.com/repos/furkanksl/md/releases/tags/v${update.version}`
          );

          let releaseData = null;
          if (withV.ok) {
            releaseData = await withV.json();
          } else {
            releaseFetchError = `GitHub release fetch failed (v): ${withV.status}`;
            const withoutV = await fetch(
              `https://api.github.com/repos/furkanksl/md/releases/tags/${update.version}`
            );
            if (withoutV.ok) {
              releaseData = await withoutV.json();
            } else {
              releaseFetchError = `GitHub release fetch failed: ${withoutV.status}`;
            }
          }
          if (releaseData && typeof releaseData.body === "string" && releaseData.body.trim() !== "") {
            resolvedBody = releaseData.body;
          }
        } catch (e: any) {
          releaseFetchError = `GitHub release fetch error: ${e?.message || "unknown"}`;
        }
        if (!resolvedBody || resolvedBody.trim() === "") {
          resolvedBody = update.body || null;
        }
        set({
          updateAvailable: true,
          posterVisible: true,
          version: update.version,
          body: resolvedBody,
          error: releaseFetchError,
          updateManifest: update,
          manualDownloadUrl: null,
        });
      } else {
        const fallback = await fallbackCheck();
        if (fallback) {
          set({
            updateAvailable: true,
            posterVisible: true,
            version: fallback.version,
            body: fallback.body,
            manualDownloadUrl: fallback.url,
            updateManifest: null,
            error: null,
          });
          await appendLog("fallback:update available", { version: fallback.version });
        } else {
          set({ updateAvailable: false, posterVisible: false, manualDownloadUrl: null });
        }
      }
    } catch (e) {
      console.error('Failed to check for updates:', e);
      set({ error: 'Failed to check for updates' });
    }
  },

  installUpdate: async () => {
    const { updateManifest } = get();
    if (!updateManifest) return;

    set({ isDownloading: true, error: null });

    try {
      let downloaded = 0;
      let contentLength = 0;

      await updateManifest.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              set({ downloadProgress: (downloaded / contentLength) * 100 });
            }
            break;
          case 'Finished':
            set({ downloadProgress: 100 });
            break;
        }
      });

      await relaunch();
    } catch (e) {
      console.error('Failed to install update:', e);
      set({ error: 'Failed to install update', isDownloading: false });
    }
  },

  dismissUpdate: () => {
    set({ posterVisible: false });
  },
}));
