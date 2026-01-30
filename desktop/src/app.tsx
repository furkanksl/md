import { MainLayout } from "@/components/main-layout";
import { Toaster } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./app.css";

function App() {
  const { theme } = useUIStore();
  const { drawerPosition } = useSettingsStore();

  useEffect(() => {
    // Sync drawer config on startup
    invoke('set_drawer_config', { config: drawerPosition });
  }, [drawerPosition]);
  
  return (
    <>
      <MainLayout />
      <Toaster 
        position="bottom-center" 
        theme={theme} 
        // closeButton 
        toastOptions={{
          className: "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-stone-900 group-[.toaster]:text-stone-950 dark:group-[.toaster]:text-stone-50 group-[.toaster]:border-stone-200 dark:group-[.toaster]:border-stone-800 group-[.toaster]:shadow-lg !rounded-[1.5rem]",
          style: {
            borderRadius: '3rem',
            bottom: '20px',
          }
        }}
      />
    </>
  );
}

export default App;