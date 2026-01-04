import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { Send, Paperclip, File as FileIcon, X } from 'lucide-react';
import { clsx } from 'clsx';
import { convertFileSrc } from '@tauri-apps/api/core';

interface MessageInputProps {
  attachments: File[];
  setAttachments: (files: File[]) => void;
}

export const MessageInput = ({ attachments, setAttachments }: MessageInputProps) => {
  const { input, setInput } = useChatStore();
  const [isFocused, setIsFocused] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({}); // Map filename/index to URL
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newPreviews: Record<string, string> = {};
    
    attachments.forEach((file) => {
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(file.name);
      
      if (isImage) {
        const path = (file as any).path;
        if (path) {
          newPreviews[file.name] = convertFileSrc(path);
        } else {
          newPreviews[file.name] = URL.createObjectURL(file);
        }
      }
    });

    setPreviews(newPreviews);

    return () => {
      // Cleanup object URLs
      Object.values(newPreviews).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [attachments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    console.log("Send:", input, attachments);
    setInput("");
    setAttachments([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const combined = [...attachments, ...newFiles].slice(0, 3);
      setAttachments(combined);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const newFiles = Array.from(e.clipboardData.files);
      const combined = [...attachments, ...newFiles].slice(0, 3);
      setAttachments(combined);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  return (
    <div className="w-full px-4 pb-4">
      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="mb-3 flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
            {attachments.map((file, index) => {
                const previewUrl = previews[file.name];
                return (
                    <div key={`${file.name}-${index}`} className="relative group">
                        {/* Tiny Thumbnail */}
                        <div className="h-12 w-12 rounded-lg border-2 border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center cursor-help">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Thumb" className="h-full w-full object-cover" />
                            ) : (
                                <FileIcon size={20} className="text-zinc-400" />
                            )}
                        </div>

                        {/* Hover Large Preview */}
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                            {previewUrl ? (
                                <div className="rounded-xl overflow-hidden border-4 border-white shadow-xl max-w-[200px]">
                                    <img src={previewUrl} alt="Preview" className="w-full h-auto" />
                                    <div className="bg-white px-2 py-1 text-[10px] font-bold text-zinc-700 truncate">
                                        {file.name}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </div>
                            )}
                        </div>

                        {/* Remove Button */}
                        <button 
                            onClick={() => removeAttachment(index)} 
                            className="absolute -top-2 -right-2 p-0.5 bg-red-500 border-2 border-white rounded-full text-white shadow-sm hover:scale-110 transition-transform"
                        >
                            <X size={10} strokeWidth={3} />
                        </button>
                    </div>
                );
            })}
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        onPaste={handlePaste}
        className={clsx(
          "flex items-center gap-2 p-1.5 bg-white border-2 border-black rounded-xl transition-all duration-200",
          isFocused ? "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]" : "shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
        )}
      >
        <div className="pl-1">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple
                onChange={handleFileChange} 
            />
            <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.length >= 3}
                className={clsx(
                    "p-1.5 rounded-lg transition-colors hover:bg-zinc-100",
                    attachments.length > 0 ? "text-blue-500" : "text-zinc-400 hover:text-zinc-600",
                    attachments.length >= 3 && "opacity-50 cursor-not-allowed"
                )}
            >
                <Paperclip size={18} strokeWidth={2.5} />
            </button>
        </div>

        <input
          className="flex-1 bg-transparent border-none focus:ring-0 px-2 text-base font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none h-10"
          placeholder={attachments.length > 0 ? "Add a message..." : "Ask anything..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        <button
            type="submit"
            disabled={!input.trim() && attachments.length === 0}
            className={clsx(
              "p-2 bg-yellow-100 border-2 border-transparent transition-all duration-200 rounded-lg",
              (input.trim() || attachments.length > 0)
                ? "border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none hover:bg-yellow-200 text-black"
                : "opacity-50 cursor-not-allowed text-zinc-400"
            )}
        >
            <Send size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
};