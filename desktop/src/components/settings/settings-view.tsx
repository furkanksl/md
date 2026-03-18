import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "@/stores/settings-store";
import { useUIStore } from "@/stores/ui-store";
import { BehaviorSection } from "./sections/behavior-section";
import { LanguageSection } from "./sections/language-section";
import { PermissionsSection } from "./sections/permissions-section";
import { IntelligenceSection } from "./sections/intelligence-section";
import { ThemeSection } from "./sections/theme-section";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const SettingsView = () => {
  const { t } = useTranslation();
  const { drawerPosition } = useSettingsStore();
  const { setActiveView } = useUIStore();

  useEffect(() => {
    // Sync drawer position with backend
    invoke("set_drawer_config", { config: drawerPosition });
  }, []);

  // Sync drawer position when it changes
  useEffect(() => {
    invoke("set_drawer_config", { config: drawerPosition });
  }, [drawerPosition]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-none px-2 py-0">
        <Tabs defaultValue="general" className="w-full">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs mb-3 mt-1">
            <TabsList className="w-full grid grid-cols-3 h-10">
              <TabsTrigger value="general" className="text-xs h-8">
                {t("nav.setup")}
              </TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs h-8">
                {t("settingsSection.appearance")}
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="text-xs h-8">
                {t("settingsSection.intelligence")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="mt-0 space-y-6">
            <LanguageSection />
            <BehaviorSection />
            <PermissionsSection />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 space-y-6">
            <ThemeSection />
          </TabsContent>

          <TabsContent value="intelligence" className="mt-0 space-y-6">
            <IntelligenceSection />
          </TabsContent>
        </Tabs>
      </div>

      {/* About Link */}
      <div className="flex justify-center py-4 shrink-0 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <button
          onClick={() => setActiveView("about")}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors hover:underline"
        >
          {t("settings.aboutMyDrawer")}
        </button>
      </div>
    </div>
  );
};
