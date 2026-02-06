import { useUpdateStore } from "@/stores/update-store";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Sparkles, X, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
                        className="absolute inset-0 bg-stone-200/50 dark:bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        className="relative w-full max-w-sm bg-white dark:bg-[#1C1917] rounded-[2rem] shadow-2xl shadow-stone-200/50 dark:shadow-black/50 border border-stone-200 dark:border-stone-800 overflow-hidden"
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
                                    className="p-2 -mr-2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors rounded-full hover:bg-stone-50 dark:hover:bg-stone-800"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 tracking-tight mb-1">
                                    Version {version} is here
                                </h2>
                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                    A fresh update with improvements and fixes.
                                </p>
                            </div>

                            {isDownloading ? (
                                <div className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-4 border border-stone-100 dark:border-stone-800">
                                    <div className="flex items-center justify-between text-xs font-medium text-stone-600 dark:text-stone-300 mb-3">
                                        <span>Downloading...</span>
                                        <span>{Math.round(downloadProgress || 0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${downloadProgress || 0}%` }}
                                            className="h-full bg-stone-800 dark:bg-stone-100"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Release Notes Area */}
                                    <div className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-4 mb-6 border border-stone-100 dark:border-stone-800 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-stone-800">
                                        <div className="prose prose-stone dark:prose-invert prose-sm text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                                            <ReactMarkdown>{body || "Includes bug fixes and performance improvements."}</ReactMarkdown>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl mb-4">
                                            <AlertCircle size={14} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={dismissUpdate}
                                            className="flex-1 py-3 px-4 rounded-full text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                                        >
                                            Not now
                                        </button>
                                        <button
                                            onClick={installUpdate}
                                            className="flex-[2] py-3 px-4 bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-200/50 dark:shadow-none"
                                        >
                                            <Download size={14} />
                                            Install Update
                                        </button>
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
