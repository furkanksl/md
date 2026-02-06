import React, { useRef, useState, useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { Paperclip, ArrowUp, X, File as FileIcon, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
    attachments: File[];
    setAttachments: (files: File[]) => void;
}

export const MessageInput = ({ attachments, setAttachments }: MessageInputProps) => {
    const { input, setInput, sendMessage, isStreaming, stopGeneration } = useChatStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [previews, setPreviews] = useState<Record<string, string>>({});
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasUsedShiftEnter, setHasUsedShiftEnter] = useState(false);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            // Reset height to allow shrinking
            textareaRef.current.style.height = "auto";

            if (input === "") {
                setIsExpanded(false);
            }

            const scrollHeight = textareaRef.current.scrollHeight;

            // Check if expanded (threshold 48 allows for some buffer over single line ~40px)
            if (scrollHeight > 48) {
                setIsExpanded(true);
            } else {
                setIsExpanded(false);
            }

            // Calculate new height, capped at 120px
            const newHeight = Math.min(scrollHeight, 120);
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [input]);

    // Generate previews when attachments change
    useEffect(() => {
        const newPreviews: Record<string, string> = {};

        attachments.forEach((file) => {
            const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(file.name);

            if (isImage) {
                newPreviews[file.name] = URL.createObjectURL(file);
            }
        });

        setPreviews(newPreviews);

        return () => {
            Object.values(newPreviews).forEach(url => URL.revokeObjectURL(url));
        };
    }, [attachments]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (isStreaming) {
            stopGeneration();
            return;
        }

        if (!input.trim() && attachments.length === 0) return;

        const attachmentData = await Promise.all(attachments.map(async (f) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        name: f.name,
                        type: f.type,
                        size: f.size,
                        base64: reader.result as string,
                        path: (f as any).path
                    });
                };
                reader.readAsDataURL(f);
            });
        }));

        setInput("");
        setAttachments([]);
        setIsExpanded(false);

        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        try {
            await sendMessage(input, attachmentData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (!e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            } else {
                setHasUsedShiftEnter(true);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments([...attachments, ...newFiles].slice(0, 3));
        }
    };

    const removeAttachment = (index: number) => {
        const n = [...attachments];
        n.splice(index, 1);
        setAttachments(n);
    };

    return (
        <div className="w-full">
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="flex gap-3 overflow-visible"
                    >
                        {attachments.map((f, i) => {
                            const previewUrl = previews[f.name];
                            return (
                                <motion.div
                                    key={`${f.name}-${i}`}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="group relative"
                                >
                                    {/* Thumbnail Container */}
                                    <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden flex items-center justify-center relative shadow-sm group/thumb">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt={f.name} className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105" />
                                        ) : (
                                            <FileIcon size={24} className="text-stone-400 dark:text-stone-500" />
                                        )}

                                        {/* Hover Remove Overlay */}
                                        <div
                                            className="absolute inset-0 bg-stone-900/40 dark:bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                            onClick={() => removeAttachment(i)}
                                        >
                                            <X size={20} className="text-white" strokeWidth={3} />
                                        </div>
                                    </div>

                                    {/* Hover Large Preview */}
                                    {previewUrl && (
                                        <div className="absolute bottom-full left-0 mb-3 hidden group-hover:block z-50 origin-bottom-left animate-in fade-in zoom-in-95 duration-200">
                                            <div className="bg-white dark:bg-stone-900 p-2 rounded-2xl shadow-xl shadow-stone-300/50 dark:shadow-black/50 border border-stone-100 dark:border-stone-800">
                                                <img src={previewUrl} alt="Large Preview" className="max-w-[200px] max-h-[200px] rounded-xl object-contain" />
                                                <div className="mt-2 text-[10px] font-medium text-stone-500 dark:text-stone-400 truncate max-w-[200px] px-1">
                                                    {f.name}
                                                </div>
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute -bottom-1 left-6 w-3 h-3 bg-white dark:bg-stone-900 rotate-45 border-b border-r border-stone-100 dark:border-stone-800 shadow-[2px_2px_2px_-1px_rgba(0,0,0,0.05)]" />
                                        </div>
                                    )}

                                    {/* Tooltip for non-images */}
                                    {!previewUrl && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap">
                                            <div className="bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 text-xs px-3 py-1.5 rounded-lg shadow-lg">
                                                {f.name}
                                            </div>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-800 dark:bg-stone-100 rotate-45" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {input.length > 30 && !hasUsedShiftEnter && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] text-stone-400 dark:text-stone-500 mb-1.5 ml-4 font-medium"
                    >
                        Use <span className="font-bold">Shift + Enter</span> for new line
                    </motion.div>
                )}
            </AnimatePresence>

            <form
                className={clsx(
                    "bg-white dark:bg-stone-900 rounded-[1.5rem] p-1 px-2 shadow-lg shadow-stone-200/40 dark:shadow-none border border-stone-100 dark:border-stone-800 flex gap-1 transition-all duration-200 ease-in-out focus-within:shadow-xl focus-within:shadow-stone-200/60 dark:focus-within:shadow-none min-h-[40px]",
                    isExpanded ? "items-end" : "items-center"
                )}
            >                <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                    "p-1.5 rounded-full transition-colors",
                    isExpanded && "mb-0.5",
                    attachments.length >= 3
                        ? "text-stone-300 dark:text-stone-600 cursor-not-allowed"
                        : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                )}
                disabled={attachments.length >= 3 || isStreaming}
            >
                    <Paperclip size={16} strokeWidth={1.5} />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                />

                <textarea
                    ref={textareaRef}
                    className="flex-1 bg-transparent border-none focus:outline-none text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600 text-sm resize-none py-2.5 max-h-[120px] scrollbar-none"
                    placeholder={attachments.length > 0 ? "Add a caption..." : "Type a message..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isStreaming}
                    rows={1}
                />

                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={(!input.trim() && attachments.length === 0) && !isStreaming}
                    className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                        isExpanded && "mb-0.5",
                        ((input.trim() || attachments.length > 0) || isStreaming)
                            ? "bg-stone-800 text-white shadow-md hover:scale-105 dark:bg-stone-100 dark:text-stone-900"
                            : "bg-stone-100 text-stone-300 cursor-not-allowed dark:bg-stone-800 dark:text-stone-600"
                    )}
                >
                    {isStreaming ? (
                        <Square size={14} fill="currentColor" />
                    ) : (
                        <ArrowUp size={16} strokeWidth={2.5} />
                    )}
                </button>
            </form>
        </div>
    );
};
