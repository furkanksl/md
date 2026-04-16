import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getEncoding } from "js-tiktoken"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Token estimator using js-tiktoken (cl100k_base is the standard for GPT-4/3.5 and a good generic estimator)
export function estimateTokens(text: string): number {
  if (!text) return 0;
  try {
    const enc = getEncoding("cl100k_base");
    return enc.encode(text).length;
  } catch (error) {
    console.warn("Failed to calculate exact tokens, using heuristic:", error);
    // Fallback heuristic: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
