import React, { useRef, useState, useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { Paperclip, ArrowUp, X, File as FileIcon, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Attachment } from '@/core/domain/entities';
import { isImeComposing } from '@/lib/ime';

interface MessageInputProps {
    attachments: File[];
    setAttachments: (files: File[]) => void;
}

export const MessageInput = ({ attachments, setAttachments }: MessageInputProps) => {
    const { input, setInput, sendMessage, isStreaming, stopGeneration } = useChatStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isComposingRef = useRef(false);
    const ignoreNextEnterRef = useRef(false);
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
            return new Promise<Attachment>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        name: f.name,
                        type: f.type,
                        size: f.size,
                        base64: reader.result as string,
                        path: (f as any).path as string
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
        if (isImeComposing(e, isComposingRef)) {
            return;
        }

        if (e.key === 'Enter') {
            if (ignoreNextEnterRef.current) {
                e.preventDefault();
                return;
            }
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
                                    <div className="w-16 h-16 rounded-md bg-muted border border-border overflow-hidden flex items-center justify-center relative shadow-sm group/thumb">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt={f.name} className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105" />
                                        ) : (
                                            <FileIcon size={24} className="text-muted-foreground" />
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
                                            <div className="bg-popover p-2 rounded-md shadow-xl border border-border">
                                                <img src={previewUrl} alt="Large Preview" className="max-w-[200px] max-h-[200px] rounded-md object-contain" />
                                                <div className="mt-2 text-[10px] font-medium text-muted-foreground truncate max-w-[200px] px-1">
                                                    {f.name}
                                                </div>
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute -bottom-1 left-6 w-3 h-3 bg-popover rotate-45 border-b border-r border-border shadow-[2px_2px_2px_-1px_rgba(0,0,0,0.05)]" />
                                        </div>
                                    )}

                                    {/* Tooltip for non-images */}
                                    {!previewUrl && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap">
                                            <div className="bg-popover-foreground text-popover text-xs px-3 py-1.5 rounded-sm shadow-lg">
                                                {f.name}
                                            </div>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover-foreground rotate-45" />
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
                        className="text-[10px] text-muted-foreground mb-1.5 ml-4 font-medium"
                    >
                        Use <span className="font-bold">Shift + Enter</span> for new line
                    </motion.div>
                )}
            </AnimatePresence>

            <form
                className={clsx(
                    "bg-card rounded-lg p-1 px-2 shadow-lg border border-border flex gap-1 transition-all duration-200 ease-in-out focus-within:shadow-xl min-h-[40px]",
                    isExpanded ? "items-end" : "items-center"
                )}
            >                <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                    "p-1.5 rounded-full transition-colors",
                    isExpanded && "mb-0.5",
                    attachments.length >= 3
                        ? "text-muted-foreground cursor-not-allowed"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
                    className="flex-1 bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground text-sm resize-none py-2.5 max-h-[120px] scrollbar-none"
                    placeholder={attachments.length > 0 ? "Add a caption..." : "Type a message..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onCompositionStart={() => {
                        isComposingRef.current = true;
                    }}
                    onCompositionEnd={() => {
                        isComposingRef.current = false;
                        ignoreNextEnterRef.current = true;
                        setTimeout(() => {
                            ignoreNextEnterRef.current = false;
                        }, 0);
                    }}
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
                            ? "bg-primary text-primary-foreground shadow-md hover:scale-105"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
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
