"use client";

import { useLoading } from "@/hooks/useLoading";
import mermaid from "mermaid";
import React, { useEffect, useState } from "react";
import CopyButton from "./CopyButton";
import MermaidTabs from "./MermaidTabs";
import StandardCodeBlock from "./StandardCodeBlock";

// Initialize mermaid globally (if not already initialized elsewhere)
mermaid.initialize({});

const CodeBlock: React.FC<any> = ({
  node,
  inline,
  className,
  children,
  ...props
}) => {
  const { isLoading } = useLoading();
  const [activeTab, setActiveTab] = useState("code");
  const [copied, setCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || "");
  const isMermaid = match && match[1] === "mermaid";

  // When loading or tab changes, reload mermaid diagrams.
  useEffect(() => {
    mermaid.contentLoaded();
  }, [isLoading, activeTab]);

  // Automatically switch to preview mode once loading is done.
  useEffect(() => {
    if (!isLoading) setActiveTab("preview");
  }, [isLoading]);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 4000);
  };

  if (isMermaid) {
    return (
      <div className="relative flex flex-col gap-0 bg-zinc-900 !pb-0 !rounded-t-[10px] w-[40vw] max-w-[30vw] overflow-x-visible">
        <MermaidTabs
          activeTab={activeTab}
          onTabChange={(key) => {
            setActiveTab(key);
            setTimeout(() => {
              mermaid.contentLoaded();
            }, 10);
          }}
          isLoading={isLoading}
          syntaxHighlighterProps={props}
        >
          {children}
        </MermaidTabs>
        <div className="absolute top-2 right-2">
          <CopyButton copied={copied} onPress={handleCopy} />
        </div>
      </div>
    );
  }

  return (
    <>
      {!inline && match ? (
        <StandardCodeBlock
          className={className}
          copied={copied}
          onCopy={handleCopy}
        >
          {children}
        </StandardCodeBlock>
      ) : (
        <code
          className={`${className} bg-black bg-opacity-40 rounded-sm`}
          {...props}
        >
          {children}
        </code>
      )}
    </>
  );
};

export default CodeBlock;
