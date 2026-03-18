import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "@/stores/settings-store";
import { ArrowRight, Check, Shield, PanelLeft, PanelRight, MousePointer2, Languages } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { appLanguageLabels, supportedLanguages, type AppLanguage } from "@/i18n/languages";

export const OnboardingView = () => {
  const [step, setStep] = useState(0);
  const { t, i18n } = useTranslation();
  const {
    setHasCompletedOnboarding,
    drawerPosition,
    setDrawerPosition,
    language,
    setLanguage,
  } = useSettingsStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkPermission();
    const interval = setInterval(checkPermission, 1000);

    const handleFocus = () => {
      checkPermission();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
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
      setTimeout(checkPermission, 1000);
    } catch (e) {
      console.error("Failed to request permission:", e);
    } finally {
      setIsChecking(false);
    }
  };

  const handleFinish = () => {
    void setHasCompletedOnboarding(true);
  };

  const onSelectLanguage = async (nextLanguage: AppLanguage) => {
    await setLanguage(nextLanguage);
    await i18n.changeLanguage(nextLanguage);
  };

  const steps = [
    {
      id: "language",
      title: t("onboarding.language.title"),
      description: t("onboarding.language.description"),
      content: (
        <div className="flex flex-col gap-4 w-full py-4">
          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-4 border border-stone-100 dark:border-stone-700">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
                <Languages size={20} />
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-5 break-words">
                {t("onboarding.language.helper")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {supportedLanguages.map((lang) => {
                const active = language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => void onSelectLanguage(lang)}
                    className={clsx(
                      "min-h-11 px-2 rounded-lg border text-xs sm:text-sm font-medium transition-all",
                      "whitespace-normal leading-tight break-words overflow-wrap-anywhere",
                      active
                        ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                        : "bg-white dark:bg-stone-700/60 text-stone-600 dark:text-stone-300 border-transparent hover:bg-stone-100 dark:hover:bg-stone-700",
                    )}
                    title={appLanguageLabels[lang]}
                  >
                    {appLanguageLabels[lang]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "welcome",
      title: t("onboarding.welcome.title"),
      description: t("onboarding.welcome.description"),
      content: <div className="flex flex-col gap-4 items-center justify-center py-8" />,
    },
    {
      id: "position",
      title: t("onboarding.position.title"),
      description: t("onboarding.position.description"),
      content: (
        <div className="flex flex-col gap-4 w-full py-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDrawerPosition("left")}
              className={clsx(
                "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all min-h-12",
                drawerPosition === "left"
                  ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                  : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800",
              )}
            >
              <PanelLeft size={16} />
              <span className="text-[10px] sm:text-xs font-medium tracking-wide text-center leading-tight break-words whitespace-normal">
                {t("onboarding.position.leftEdge")}
              </span>
            </button>
            <button
              onClick={() => setDrawerPosition("right")}
              className={clsx(
                "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all min-h-12",
                drawerPosition === "right"
                  ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                  : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800",
              )}
            >
              <PanelRight size={16} />
              <span className="text-[10px] sm:text-xs font-medium tracking-wide text-center leading-tight break-words whitespace-normal">
                {t("onboarding.position.rightEdge")}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDrawerPosition("top-left")}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all min-h-16",
                  drawerPosition === "top-left"
                    ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                    : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800",
                )}
              >
                <div className="w-6 h-6 border-l-2 border-t-2 border-current rounded-tl-md" />
                <span className="text-[9px] font-medium tracking-wide text-center leading-tight break-words whitespace-normal">
                  {t("onboarding.position.topLeft")}
                </span>
              </button>
              <button
                onClick={() => setDrawerPosition("bottom-left")}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all min-h-16",
                  drawerPosition === "bottom-left"
                    ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                    : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800",
                )}
              >
                <div className="w-6 h-6 border-l-2 border-b-2 border-current rounded-bl-md" />
                <span className="text-[9px] font-medium tracking-wide text-center leading-tight break-words whitespace-normal">
                  {t("onboarding.position.bottomLeft")}
                </span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDrawerPosition("top-right")}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all min-h-16",
                  drawerPosition === "top-right"
                    ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                    : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800",
                )}
              >
                <div className="w-6 h-6 border-r-2 border-t-2 border-current rounded-tr-md" />
                <span className="text-[9px] font-medium tracking-wide text-center leading-tight break-words whitespace-normal">
                  {t("onboarding.position.topRight")}
                </span>
              </button>
              <button
                onClick={() => setDrawerPosition("bottom-right")}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all min-h-16",
                  drawerPosition === "bottom-right"
                    ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                    : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800",
                )}
              >
                <div className="w-6 h-6 border-r-2 border-b-2 border-current rounded-br-md" />
                <span className="text-[9px] font-medium tracking-wide text-center leading-tight break-words whitespace-normal">
                  {t("onboarding.position.bottomRight")}
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setDrawerPosition("hot-corners")}
            className={clsx(
              "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all min-h-12 w-full",
              drawerPosition === "hot-corners"
                ? "bg-stone-800 text-white border-transparent dark:bg-stone-100 dark:text-stone-900"
                : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800",
            )}
          >
            <MousePointer2 size={16} />
            <span className="text-[10px] sm:text-xs font-medium tracking-wide text-center leading-tight break-words whitespace-normal">
              {t("onboarding.position.allHotCorners")}
            </span>
          </button>
        </div>
      ),
    },
    {
      id: "permissions",
      title: t("onboarding.permissions.title"),
      description: t("onboarding.permissions.description"),
      content: (
        <div className="flex flex-col gap-6 items-center justify-center py-6 w-full">
          <div
            className={clsx(
              "w-full p-4 rounded-2xl border flex items-center justify-between transition-colors",
              hasPermission
                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50"
                : "bg-stone-50 border-stone-100 dark:bg-stone-800 dark:border-stone-700",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={clsx(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  hasPermission
                    ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-white text-stone-400 dark:bg-stone-700 dark:text-stone-500",
                )}
              >
                <Shield size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-stone-800 dark:text-stone-200 break-words">
                  {t("onboarding.permissions.accessibility")}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 break-words">
                  {hasPermission ? t("onboarding.permissions.granted") : t("onboarding.permissions.required")}
                </span>
              </div>
            </div>

            {hasPermission ? (
              <div className="w-8 h-8 bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 rounded-full flex items-center justify-center shrink-0">
                <Check size={16} />
              </div>
            ) : (
              <button
                onClick={requestPermission}
                disabled={isChecking}
                className="px-3 py-1.5 bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
              >
                {isChecking ? t("common.checking") : t("common.enable")}
              </button>
            )}
          </div>

          <p className="text-xs text-center text-stone-400 dark:text-stone-500 max-w-[280px] break-words leading-relaxed">
            {t("onboarding.permissions.helper")}
          </p>
        </div>
      ),
    },
    {
      id: "finish",
      title: t("onboarding.finish.title"),
      description: t("onboarding.finish.description"),
      content: (
        <div className="flex flex-col gap-4 items-center justify-center py-8">
          <div className="w-20 h-20 bg-stone-800 dark:bg-stone-100 rounded-[2rem] flex items-center justify-center text-white dark:text-stone-900 mb-4 shadow-xl shadow-stone-200 dark:shadow-none">
            <Check size={40} />
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  if (!currentStep) return null;

  return (
    <div className="h-full w-full flex flex-col bg-background p-8">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center min-w-0"
          >
            <h1 className="text-2xl font-semibold text-stone-800 dark:text-stone-200 mb-2 text-center tracking-tight break-words leading-tight">
              {currentStep.title}
            </h1>

            <p className="text-stone-500 dark:text-stone-400 text-center text-sm mb-8 leading-relaxed break-words">
              {currentStep.description}
            </p>

            {currentStep.content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between w-full max-w-sm mx-auto mt-8 gap-3">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={clsx(
                "h-2 rounded-full transition-all duration-300",
                i === step ? "bg-stone-800 dark:bg-stone-100 w-6" : "bg-stone-200 dark:bg-stone-800 w-2",
              )}
            />
          ))}
        </div>

        <button
          onClick={() => {
            if (step < steps.length - 1) {
              setStep((s) => s + 1);
            } else {
              handleFinish();
            }
          }}
          className="group flex items-center gap-2 px-5 py-2.5 bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-medium text-sm hover:opacity-90 transition-all active:scale-95 shrink-0"
        >
          {step === steps.length - 1 ? t("common.getStarted") : t("common.next")}
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
