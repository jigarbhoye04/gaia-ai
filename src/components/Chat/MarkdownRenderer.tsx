import React, { lazy, Suspense } from "react";
import remarkGfm from "remark-gfm";
import SuspenseLoader from "../Misc/SuspenseLoader";
import CustomAnchor from "./CodeBlock/CustomAnchor";
const ReactMarkdown = lazy(() => import("react-markdown"));
const CodeBlock = lazy(() => import("./CodeBlock/CodeBlock"));

export interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code: ({ node, className, children, ...props }) => (
            <Suspense fallback={<SuspenseLoader />}>
              <CodeBlock node={node} className={className} {...props}>
                {children}
              </CodeBlock>
            </Suspense>
          ),
          h1: ({ node, ...props }) => (
            <h1 className="mb-4 mt-6 text-3xl font-bold" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="mb-3 mt-5 text-2xl font-bold" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mb-2 mt-4 text-xl font-bold" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="mb-4 list-disc pl-6" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mb-4 list-decimal pl-6" {...props} />
          ),
          a: ({ href, children }) => (
            <CustomAnchor href={href}>{children}</CustomAnchor>
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-4 border-l-4 border-gray-300 pl-4 italic"
              {...props}
            />
          ),
          img: ({ node, ...props }) => (
            <img alt="image" className="my-4 h-auto max-w-full" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto">
              <table
                className="min-w-full border-collapse rounded-md border border-gray-300"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-200 bg-opacity-20" {...props} />
          ),
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => (
            <tr className="border-b border-gray-300" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left font-bold" {...props} />
          ),
          td: ({ node, ...props }) => <td className="px-4 py-2" {...props} />,
        }}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
