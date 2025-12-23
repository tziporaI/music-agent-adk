"use client";

import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Enhanced markdown components for better styling with consistent dark theme
export const mdComponents: Partial<Components> = {
  h1: ({ children, ...props }) => (
    <h1
      className="text-xl font-bold mb-3 text-slate-100 leading-tight"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-lg font-semibold mb-2 text-slate-100 leading-tight"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-base font-medium mb-2 text-slate-100 leading-tight"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="text-sm font-medium mb-1 text-slate-200 leading-tight"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="text-sm font-medium mb-1 text-slate-200 leading-tight"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6
      className="text-sm font-medium mb-1 text-slate-200 leading-tight"
      {...props}
    >
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-2 leading-relaxed text-slate-200 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul
      className="list-disc list-inside mb-2 space-y-1 text-slate-200"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="list-decimal list-inside mb-2 space-y-1 text-slate-200"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed text-slate-200" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-blue-400 pl-4 py-2 mb-2 bg-slate-800/30 rounded-r italic text-slate-300"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }) => (
    <code
      className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="bg-slate-800 text-slate-200 p-3 rounded-lg mb-2 overflow-x-auto border border-slate-700"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="mb-2 overflow-x-auto">
      <table
        className="min-w-full border-collapse border border-slate-600 text-slate-200"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-slate-600 bg-slate-700 px-3 py-2 text-left font-medium"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-slate-600 px-3 py-2" {...props}>
      {children}
    </td>
  ),
  a: ({ children, href, ...props }) => (
    <a
      className="text-blue-400 hover:text-blue-300 underline transition-colors"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-slate-100" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-slate-200" {...props}>
      {children}
    </em>
  ),
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
  components?: Partial<Components>;
}

/**
 * Dedicated markdown renderer component with consistent styling
 * Handles all markdown rendering with proper dark theme styling
 */
export function MarkdownRenderer({
  content,
  className = "",
  components = mdComponents,
}: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
