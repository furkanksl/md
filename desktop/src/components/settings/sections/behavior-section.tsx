import { useSettingsStore } from '@/stores/settings-store';
import { clsx } from 'clsx';
import { EyeOff, PanelLeft, PanelRight, MousePointer2, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BehaviorSection = () => {
    const { t } = useTranslation();
    const { autoHide, setAutoHide, drawerPosition, setDrawerPosition, startAtLogin, setStartAtLogin } = useSettingsStore();

    return (
        <div>
            <h2 className="text-xl font-light text-foreground mb-4">{t('settings.behavior.title')}</h2>
            <div className="space-y-3">
                <div className="bg-card rounded-md p-4 border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-10 h-10 rounded-md flex items-center justify-center",
                                startAtLogin ? "bg-secondary text-secondary-foreground" : "bg-muted/50 text-muted-foreground"
                            )}>
                                <KeyRound size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{t('settings.behavior.startAtLogin.title')}</span>
                                <span className="text-xs text-muted-foreground">
                                    {t('settings.behavior.startAtLogin.description')}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setStartAtLogin(!startAtLogin)}
                            className={clsx(
                                "w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out relative",
                                startAtLogin ? "bg-primary" : "bg-input"
                            )}
                        >
                            <div className={clsx(
                                "w-5 h-5 rounded-full bg-background shadow-sm transition-transform duration-300 ease-in-out",
                                startAtLogin ? "translate-x-5" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                </div>

                <div className="bg-card rounded-md p-4 border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-10 h-10 rounded-md flex items-center justify-center",
                                autoHide ? "bg-secondary text-secondary-foreground" : "bg-muted/50 text-muted-foreground"
                            )}>
                                <EyeOff size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{t('settings.behavior.autoHide.title')}</span>
                                <span className="text-xs text-muted-foreground">
                                    {t('settings.behavior.autoHide.description')}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setAutoHide(!autoHide)}
                            className={clsx(
                                "w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out relative",
                                autoHide ? "bg-primary" : "bg-input"
                            )}
                        >
                            <div className={clsx(
                                "w-5 h-5 rounded-full bg-background shadow-sm transition-transform duration-300 ease-in-out",
                                autoHide ? "translate-x-5" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                </div>

                <div className="bg-card rounded-md p-4 border border-border shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center">
                                {drawerPosition === 'left' ? <PanelLeft size={20} /> : drawerPosition === 'right' ? <PanelRight size={20} /> : <MousePointer2 size={20} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{t('settings.behavior.drawerPosition.title')}</span>
                                <span className="text-xs text-muted-foreground">
                                    {t('settings.behavior.drawerPosition.description')}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setDrawerPosition('left')}
                                className={clsx(
                                    "flex items-center justify-center gap-2 p-3 rounded-md border transition-all h-10",
                                    drawerPosition === 'left'
                                        ? "bg-primary text-primary-foreground border-transparent"
                                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                )}
                            >
                                <PanelLeft size={16} />
                                <span className="text-[10px] font-medium uppercase tracking-wide">{t('settings.behavior.drawerPosition.leftEdge')}</span>
                            </button>
                            <button
                                onClick={() => setDrawerPosition('right')}
                                className={clsx(
                                    "flex items-center justify-center gap-2 p-3 rounded-md border transition-all h-10",
                                    drawerPosition === 'right'
                                        ? "bg-primary text-primary-foreground border-transparent"
                                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                )}
                            >
                                <PanelRight size={16} />
                                <span className="text-[10px] font-medium uppercase tracking-wide">{t('settings.behavior.drawerPosition.rightEdge')}</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setDrawerPosition('top-left')}
                                    className={clsx(
                                        "flex flex-col items-center justify-center gap-1 p-2 rounded-md border transition-all h-16",
                                        drawerPosition === 'top-left'
                                            ? "bg-primary text-primary-foreground border-transparent"
                                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                    )}
                                >
                                    <div className="w-6 h-6 border-l-2 border-t-2 border-current rounded-tl-md" />
                                    <span className="text-[9px] font-medium uppercase tracking-wide">{t('settings.behavior.drawerPosition.topLeft')}</span>
                                </button>
                                <button
                                    onClick={() => setDrawerPosition('bottom-left')}
                                    className={clsx(
                                        "flex flex-col items-center justify-center gap-1 p-2 rounded-md border transition-all h-16",
                                        drawerPosition === 'bottom-left'
                                            ? "bg-primary text-primary-foreground border-transparent"
                                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                    )}
                                >
                                    <div className="w-6 h-6 border-l-2 border-b-2 border-current rounded-bl-md" />
                                    <span className="text-[9px] font-medium uppercase tracking-wide">{t('settings.behavior.drawerPosition.bottomLeft')}</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setDrawerPosition('top-right')}
                                    className={clsx(
                                        "flex flex-col items-center justify-center gap-1 p-2 rounded-md border transition-all h-16",
                                        drawerPosition === 'top-right'
                                            ? "bg-primary text-primary-foreground border-transparent"
                                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                    )}
                                >
                                    <div className="w-6 h-6 border-r-2 border-t-2 border-current rounded-tr-md" />
                                    <span className="text-[9px] font-medium uppercase tracking-wide">{t('settings.behavior.drawerPosition.topRight')}</span>
                                </button>
                                <button
                                    onClick={() => setDrawerPosition('bottom-right')}
                                    className={clsx(
                                        "flex flex-col items-center justify-center gap-1 p-2 rounded-md border transition-all h-16",
                                        drawerPosition === 'bottom-right'
                                            ? "bg-primary text-primary-foreground border-transparent"
                                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                                    )}
                                >
                                    <div className="w-6 h-6 border-r-2 border-b-2 border-current rounded-br-md" />
                                    <span className="text-[9px] font-medium uppercase tracking-wide">{t('settings.behavior.drawerPosition.bottomRight')}</span>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setDrawerPosition('hot-corners')}
                            className={clsx(
                                "flex items-center justify-center gap-2 p-3 rounded-md border transition-all h-10 w-full",
                                drawerPosition === 'hot-corners'
                                    ? "bg-primary text-primary-foreground border-transparent"
                                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                            )}
                        >
                            <MousePointer2 size={16} />
                            <span className="text-[10px] font-medium uppercase tracking-wide">{t('settings.behavior.drawerPosition.allHotCorners')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
