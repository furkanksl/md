import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '@/stores/settings-store';
import { useUIStore } from '@/stores/ui-store';
import { BehaviorSection } from './sections/behavior-section';
import { PermissionsSection } from './sections/permissions-section';
import { IntelligenceSection } from './sections/intelligence-section';

export const SettingsView = () => {
    const { drawerPosition } = useSettingsStore();
    const { setActiveView } = useUIStore();

    useEffect(() => {
        // Sync drawer position with backend
        invoke('set_drawer_config', { config: drawerPosition });
    }, []);

    // Sync drawer position when it changes
    useEffect(() => {
        invoke('set_drawer_config', { config: drawerPosition });
    }, [drawerPosition]);

    return (
        <div className="h-full px-4 py-3 overflow-y-auto scrollbar-none space-y-6">
            <BehaviorSection />
            <IntelligenceSection />
            <PermissionsSection />

            {/* About Link */}
            <div className="flex justify-center pb-4">
                <button
                    onClick={() => setActiveView("about")}
                    className="text-[10px] text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 transition-colors hover:underline"
                >
                    About My Drawer
                </button>
            </div>
        </div>
    );
};