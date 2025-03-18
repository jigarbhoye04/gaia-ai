import React from "react";
import { PrismAsyncLight } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MermaidCodeProps {
  children: React.ReactNode;
  syntaxHighlighterProps?: any;
}

const MermaidCode: React.FC<MermaidCodeProps> = ({
  children,
  syntaxHighlighterProps,
}) => {
  return (
    <PrismAsyncLight
      {...syntaxHighlighterProps}
      showLineNumbers
      PreTag="div"
      className="m-0 !bg-black p-0 !text-[10px]"
      language="mermaid"
      style={vscDarkPlus}
    >
      {String(children).replace(/\n$/, "")}
    </PrismAsyncLight>
  );
};

export default MermaidCode;
