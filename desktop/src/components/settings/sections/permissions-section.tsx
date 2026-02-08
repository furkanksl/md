import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { clsx } from 'clsx';
import { Shield, Check } from 'lucide-react';

export const PermissionsSection = () => {
    const [hasPermission, setHasPermission] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        checkPermission();
        const interval = setInterval(checkPermission, 1000);

        // Add focus listener
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
            setTimeout(checkPermission, 1000);
        } catch (e) {
            console.error("Failed to request permission:", e);
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-light text-foreground mb-4">Permissions</h2>
            <div className="bg-card rounded-[1.5rem] p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            hasPermission ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" : "bg-muted text-muted-foreground"
                        )}>
                            <Shield size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">Accessibility</span>
                            <span className="text-xs text-muted-foreground">
                                {hasPermission ? "Granted" : "Required for context"}
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
                            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isChecking ? "Checking..." : "Request"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
