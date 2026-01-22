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
        "prose prose-stone dark:prose-invert max-w-full w-full min-w-0 text-inherit leading-relaxed break-words overflow-x-auto grid grid-cols-1 scrollbar-none",
        "prose-p:my-0",
        "prose-pre:my-2 prose-pre:bg-stone-100/50 dark:prose-pre:bg-stone-800/50 prose-pre:rounded-xl prose-pre:p-3 prose-pre:overflow-x-auto prose-pre:max-w-full",
        "prose-code:text-stone-800 dark:prose-code:text-stone-200 prose-code:bg-stone-100/50 dark:prose-code:bg-stone-800/50 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:break-all",
        "prose-ul:my-2 prose-ol:my-2 prose-li:my-0",
        className
    )}>
      <Component>
        {content}
      </Component>
    </div>
  );
};
