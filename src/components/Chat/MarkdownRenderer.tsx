import Image from "next/image";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock/CodeBlock";
import CustomAnchor from "./CodeBlock/CustomAnchor";

export interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code: ({ className, children, ...props }) => (
            <CodeBlock className={className} {...props}>
              {children}
            </CodeBlock>
          ),
          h1: ({ ...props }) => (
            <h1 className="mb-4 mt-6 text-3xl font-bold" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="mb-3 mt-5 text-2xl font-bold" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="mb-2 mt-4 text-xl font-bold" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="mb-4 list-disc pl-6" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="mb-4 list-decimal pl-6" {...props} />
          ),
          a: ({ href, children }) => (
            <CustomAnchor href={href}>{children}</CustomAnchor>
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="my-4 border-l-4 border-gray-300 pl-4 italic"
              {...props}
            />
          ),
          img: ({ ...props }) => (
            <img
              // fill={true}
              alt="image"
              className="my-4"
              src={props.src as string}
              // {...props}
            />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto">
              <table
                className="min-w-full border-collapse rounded-md border border-gray-300"
                {...props}
              />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead className="bg-gray-200 bg-opacity-20" {...props} />
          ),
          tbody: ({ ...props }) => <tbody {...props} />,
          tr: ({ ...props }) => (
            <tr className="border-b border-gray-300" {...props} />
          ),
          th: ({ ...props }) => (
            <th className="px-4 py-2 text-left font-bold" {...props} />
          ),
          td: ({ ...props }) => <td className="px-4 py-2" {...props} />,
        }}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
