import React from "react";
import { PrismAsyncLight } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@heroui/button";
import { Task01Icon, TaskDone01Icon } from "../../Misc/icons";

interface StandardCodeBlockProps {
  className?: string;
  children: React.ReactNode;
  copied: boolean;
  onCopy: () => void;
}

const StandardCodeBlock: React.FC<StandardCodeBlockProps> = ({
  className,
  children,
  copied,
  onCopy,
}) => {
  const match = /language-(\w+)/.exec(className || "");

  return (
    <div className="relative flex flex-col gap-0 ">
      <div className="flex justify-between items-center bg-zinc-900 text-white px-4 py-1 !rounded-t-[10px] !rounded-b-none mb-[-0.5em] !sticky top-0">
        <span className="text-sm font-mono monospace">
          {match ? match[1] : ""}
        </span>
        <Button
          className="text-foreground hover:text-gray-300 text-xs"
          size="sm"
          variant="light"
          onPress={onCopy}
        >
          {copied ? (
            <div className="flex flex-row gap-1 items-center">
              <TaskDone01Icon color="foreground" width={21} />
              <p>Copied!</p>
            </div>
          ) : (
            <div className="flex flex-row gap-1 items-center">
              <Task01Icon color="foreground" width={21} />
              <p>Copy Code</p>
            </div>
          )}
        </Button>
      </div>
      <PrismAsyncLight
        showLineNumbers
        PreTag="div"
        className="m-0 !bg-black !text-[10px] max-w-[35vw] overflow-x-visible"
        language={match ? match[1] : undefined}
        style={vscDarkPlus}
      >
        {String(children).replace(/\n$/, "")}
      </PrismAsyncLight>
    </div>
  );
};

export default StandardCodeBlock;
