"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ArticleContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => (
            <h1
              id={String(children).toLowerCase().replace(/[^a-z0-9가-힣]/g, "-")}
              className="mt-8 mb-4 text-xl font-bold"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              id={String(children).toLowerCase().replace(/[^a-z0-9가-힣]/g, "-")}
              className="mt-8 mb-3 border-b border-[var(--color-border)] pb-1 text-lg font-semibold"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              id={String(children).toLowerCase().replace(/[^a-z0-9가-힣]/g, "-")}
              className="mt-6 mb-2 text-base font-semibold"
              {...props}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mt-2 text-sm leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="ml-4 list-disc space-y-1">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-[var(--color-border)]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--color-sidebar)]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-[var(--color-border)] px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[var(--color-border)] px-3 py-2">
              {children}
            </td>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
