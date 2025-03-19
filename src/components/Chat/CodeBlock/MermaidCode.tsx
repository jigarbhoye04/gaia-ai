import React from "react";
import { PrismAsyncLight } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface SyntaxHighlighterProps {
  style?: object;
  language?: string;
  children?: React.ReactNode;
  className?: string;
  showLineNumbers?: boolean;
  lineNumberStyle?: object;
  wrapLines?: boolean;
  wrapLongLines?: boolean;
  lineProps?: object | ((lineNumber: number) => object);
  customStyle?: object;
  codeTagProps?: object;
  useInlineStyles?: boolean;
  // [key: string]: any;
}

interface MermaidCodeProps {
  children: React.ReactNode;
  syntaxHighlighterProps?: SyntaxHighlighterProps;
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
