import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "@/stores/settings-store";
import { ArrowRight, Check, Shield } from "lucide-react";
import { clsx } from "clsx";

export const OnboardingView = () => {
  const [step, setStep] = useState(0);
  const { setHasCompletedOnboarding } = useSettingsStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkPermission();
    // Check permission every second in case user grants it outside app
    const interval = setInterval(checkPermission, 1000);
    
    // Add focus listener to check immediately when app comes to foreground
    const handleFocus = () => {
        checkPermission();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkPermission = async () => {
    try {
      const granted = await invoke<boolean>("check_accessibility_permission");
      setHasPermission(granted);
    } catch (e) {
      console.error("Failed to check permission:", e);
    }
  };

  const requestPermission = async () => {
    setIsChecking(true);
    try {
      await invoke("request_accessibility_permission");
      // Give it a moment for the system prompt
      setTimeout(checkPermission, 1000);
    } catch (e) {
      console.error("Failed to request permission:", e);
    } finally {
      setIsChecking(false);
    }
  };

  const handleFinish = () => {
    setHasCompletedOnboarding(true);
  };

  const steps = [
    {
      id: "welcome",
      title: "Welcome to My Drawer",
      description: "Your new personal AI workspace. Chat, collect, and organize with ease.",
      content: (
        <div className="flex flex-col gap-4 items-center justify-center py-8">
            {/* <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-600 dark:text-stone-300 mb-4">
                <Zap size={32} />
            </div>
            <p className="text-center text-stone-500 dark:text-stone-400 text-sm max-w-[280px]">
                My Drawer runs locally and integrates deeply with your system to boost your productivity.
            </p> */}
        </div>
      )
    },
    {
      id: "permissions",
      title: "System Permissions",
      description: "To help you better, My Drawer needs accessibility permissions to interact with other apps.",
      content: (
        <div className="flex flex-col gap-6 items-center justify-center py-6 w-full">
            <div className={clsx(
                "w-full p-4 rounded-2xl border flex items-center justify-between transition-colors",
                hasPermission 
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50" 
                    : "bg-stone-50 border-stone-100 dark:bg-stone-800 dark:border-stone-700"
            )}>
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        hasPermission ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" : "bg-white text-stone-400 dark:bg-stone-700 dark:text-stone-500"
                    )}>
                        <Shield size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-stone-800 dark:text-stone-200">Accessibility</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                            {hasPermission ? "Permission granted" : "Required for full functionality"}
                        </span>
                    </div>
                </div>
                
                {hasPermission ? (
                    <div className="w-8 h-8 bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 rounded-full flex items-center justify-center">
                        <Check size={16} />
                    </div>
                ) : (
                    <button
                        onClick={requestPermission}
                        disabled={isChecking}
                        className="px-3 py-1.5 bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isChecking ? "Checking..." : "Enable"}
                    </button>
                )}
            </div>
            
            <p className="text-xs text-center text-stone-400 dark:text-stone-500 max-w-[280px]">
                We use this to read context from your active window when you ask for help. We never store this data permanently without your action.
            </p>
        </div>
      )
    },
    {
      id: "finish",
      title: "You're all set",
      description: "Ready to start using My Drawer? Press the finish button below.",
      content: (
        <div className="flex flex-col gap-4 items-center justify-center py-8">
            <div className="w-20 h-20 bg-stone-800 dark:bg-stone-100 rounded-[2rem] flex items-center justify-center text-white dark:text-stone-900 mb-4 shadow-xl shadow-stone-200 dark:shadow-none">
                <Check size={40} />
            </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step];

  if (!currentStep) return null;

  return (
    <div className="h-full w-full flex flex-col bg-[#FAF9F6] dark:bg-[#1C1917] p-8">
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex flex-col items-center"
                >
                    <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-200 mb-2 text-center tracking-tight">
                        {currentStep.title}
                    </h1>
                    
                    <p className="text-stone-500 dark:text-stone-400 text-center text-sm mb-8 leading-relaxed">
                        {currentStep.description}
                    </p>

                    {currentStep.content}
                </motion.div>
            </AnimatePresence>
        </div>

        <div className="flex items-center justify-between w-full max-w-sm mx-auto mt-8">
            <div className="flex gap-1.5">
                {steps.map((_, i) => (
                    <div 
                        key={i}
                        className={clsx(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            i === step ? "bg-stone-800 dark:bg-stone-100 w-6" : "bg-stone-200 dark:bg-stone-800"
                        )}
                    />
                ))}
            </div>

            <button
                onClick={() => {
                    if (step < steps.length - 1) {
                        setStep(s => s + 1);
                    } else {
                        handleFinish();
                    }
                }}
                className="group flex items-center gap-2 px-5 py-2.5 bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-medium text-sm hover:opacity-90 transition-all active:scale-95"
            >
                {step === steps.length - 1 ? "Get Started" : "Next"}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
        </div>
    </div>
  );
};
