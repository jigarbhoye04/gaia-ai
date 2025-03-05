import React, { lazy, Suspense } from "react";
import remarkGfm from "remark-gfm";
import SuspenseLoader from "../Misc/SuspenseLoader";
const ReactMarkdown = lazy(() => import("react-markdown"));
const CodeBlock = lazy(() => import("./CodeBlock/CodeBlock"));
const CustomAnchor = lazy(() => import("./CodeBlock/CustomAnchor"));

export interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <Suspense fallback={<SuspenseLoader />}>
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
              <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-xl font-bold mt-4 mb-2" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-6 mb-4" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-6 mb-4" {...props} />
            ),
            a: ({ node, ...props }) => (
              <Suspense fallback={<SuspenseLoader />}>
                <CustomAnchor {...props} />
              </Suspense>
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-gray-300 pl-4 italic my-4"
                {...props}
              />
            ),
            img: ({ node, ...props }) => (
              <img alt="image" className="max-w-full h-auto my-4" {...props} />
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto">
                <table
                  className="min-w-full border-collapse border border-gray-300 rounded-md"
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
      </Suspense>
    </div>
  );
};

export default MarkdownRenderer;
