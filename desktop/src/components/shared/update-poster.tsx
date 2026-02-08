import { useUpdateStore } from "@/stores/update-store";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Sparkles, X, AlertCircle, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { open } from "@tauri-apps/plugin-shell";

export const UpdatePoster = () => {
    const {
        posterVisible,
        version,
        body,
        isDownloading,
        downloadProgress,
        error,
        installUpdate,
        dismissUpdate,
        manualDownloadUrl,
    } = useUpdateStore();

    return (
        <AnimatePresence>
            {posterVisible && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={dismissUpdate}
                        className="absolute inset-0 bg-background/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        className="relative w-full max-w-sm bg-card rounded-lg shadow-xl border border-border overflow-hidden"
                    >
                        <div className="p-4">
                            {/* Header Badge */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[11px] font-medium border border-amber-100 dark:border-amber-900/30">
                                    <Sparkles size={12} />
                                    <span>New version</span>
                                </div>

                                <button
                                    onClick={dismissUpdate}
                                    className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-foreground tracking-tight mb-1">
                                    Version {version} is here
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    A fresh update with improvements and fixes.
                                </p>
                            </div>

                            {isDownloading ? (
                                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                                    <div className="flex items-center justify-between text-xs font-medium text-foreground mb-3">
                                        <span>Downloading...</span>
                                        <span>{Math.round(downloadProgress || 0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${downloadProgress || 0}%` }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Release Notes Area */}
                                    <div className="bg-muted/30 rounded-lg p-4 mb-6 border border-border max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
                                        <div className="prose prose-stone dark:prose-invert prose-sm text-xs text-muted-foreground leading-relaxed">
                                            <ReactMarkdown>{body || "Includes bug fixes and performance improvements."}</ReactMarkdown>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg mb-4">
                                            <AlertCircle size={14} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={dismissUpdate}
                                            className="flex-1 py-3 px-4 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                            Not now
                                        </button>
                                        {manualDownloadUrl ? (
                                            <button
                                                onClick={() => open(manualDownloadUrl)}
                                                className="flex-[2] py-3 px-4 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                            >
                                                <ExternalLink size={14} />
                                                Download Update
                                            </button>
                                        ) : (
                                            <button
                                                onClick={installUpdate}
                                                className="flex-[2] py-3 px-4 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                            >
                                                <Download size={14} />
                                                Install Update
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};