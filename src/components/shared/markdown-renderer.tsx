import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  const Component = ReactMarkdown as any;
  return (
    <div className={clsx(
        "prose prose-stone dark:prose-invert max-w-none text-inherit leading-relaxed",
        "prose-p:my-1 prose-pre:bg-stone-100 dark:prose-pre:bg-stone-800 prose-pre:rounded-xl",
        "prose-code:text-stone-800 dark:prose-code:text-stone-200 prose-code:bg-stone-100 dark:prose-code:bg-stone-800 prose-code:px-1 prose-code:rounded",
        className
    )}>
      <Component children={content} />
    </div>
  );
};
