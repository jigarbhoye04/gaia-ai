import { Button } from "@heroui/button";
import React from "react";
import { PrismAsyncLight } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

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
    <div className="relative flex flex-col gap-0">
      <div className="sticky! top-0 mb-[-0.5em] flex items-center justify-between rounded-b-none! rounded-t-[10px]! bg-zinc-900 px-4 py-1 text-white">
        <span className="monospace font-mono text-sm">
          {match ? match[1] : ""}
        </span>
        <Button
          className="text-xs text-foreground hover:text-gray-300"
          size="sm"
          variant="light"
          onPress={onCopy}
        >
          {copied ? (
            <div className="flex flex-row items-center gap-1">
              <TaskDone01Icon color="foreground" width={21} />
              <p>Copied!</p>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-1">
              <Task01Icon color="foreground" width={21} />
              <p>Copy Code</p>
            </div>
          )}
        </Button>
      </div>
      <PrismAsyncLight
        showLineNumbers
        PreTag="div"
        className="m-0 max-w-[35vw] overflow-x-visible bg-black! text-[10px]!"
        language={match ? match[1] : undefined}
        style={vscDarkPlus}
      >
        {String(children).replace(/\n$/, "")}
      </PrismAsyncLight>
    </div>
  );
};

export default StandardCodeBlock;
