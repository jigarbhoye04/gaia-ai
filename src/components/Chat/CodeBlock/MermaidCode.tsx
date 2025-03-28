import React from "react";
import { CSSProperties } from "react";
import { PrismAsyncLight } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface SyntaxHighlighterProps {
  style?: CSSProperties;
  language?: string;
  children?: React.ReactNode;
  className?: string;
  showLineNumbers?: boolean;
  lineNumberStyle?: CSSProperties;
  wrapLines?: boolean;
  wrapLongLines?: boolean;
  lineProps?: object | ((lineNumber: number) => object);
  customStyle?: CSSProperties;
  codeTagProps?: object;
  useInlineStyles?: boolean;
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
      customStyle={{} as CSSProperties}
    >
      {String(children).replace(/\n$/, "")}
    </PrismAsyncLight>
  );
};

export default MermaidCode;
