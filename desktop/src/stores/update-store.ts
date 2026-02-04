import { create } from 'zustand';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

interface UpdateStore {
  updateAvailable: boolean;
  posterVisible: boolean;
  version: string | null;
  body: string | null;
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
      const update = await check();
      if (update && update.available) {
        set({
          updateAvailable: true,
          posterVisible: true,
          version: update.version,
          body: update.body,
          updateManifest: update,
        });
      } else {
        set({ updateAvailable: false, posterVisible: false });
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
