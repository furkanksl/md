import { MainLayout } from "@/components/main-layout";
import { Toaster } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import "./app.css";

function App() {
  const { theme } = useUIStore();
  
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