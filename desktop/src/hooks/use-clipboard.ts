import { useState } from 'react';
import { toast } from 'sonner';

export const useClipboard = (timeout = 2000) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setIsCopied(false), timeout);
    } catch (err) {
      console.error('Failed to copy!', err);
      toast.error('Failed to copy');
    }
  };

  return { isCopied, copyToClipboard };
};
