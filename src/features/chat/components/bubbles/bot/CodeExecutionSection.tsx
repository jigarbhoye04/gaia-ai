import React, { useState } from "react";

import CodeBlock from "@/features/chat/components/code-block/CodeBlock";

import CodeExecutionOutput from "./CodeExecutionOutput";

interface CodeExecutionSectionProps {
  code_data: {
    language: string;
    code: string;
    output?: {
      stdout: string;
      stderr: string;
      exit_code: number;
    } | null;
    status?: "executing" | "completed" | "error";
  };
}

// Language display configuration
const LANGUAGE_DISPLAY = {
  python: { name: "Python", color: "text-blue-400" },
  javascript: { name: "JavaScript", color: "text-yellow-400" },
  typescript: { name: "TypeScript", color: "text-blue-500" },
  ruby: { name: "Ruby", color: "text-red-400" },
  php: { name: "PHP", color: "text-purple-400" },
} as const;

const getLanguageDisplay = (language: string) => {
  const lang = language.toLowerCase() as keyof typeof LANGUAGE_DISPLAY;
  return LANGUAGE_DISPLAY[lang] || { name: language, color: "text-gray-400" };
};

const createCopyHandler = (
  text: string,
  setCopied: (value: boolean) => void,
) => {
  return () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
};

const CodeExecutionSection: React.FC<CodeExecutionSectionProps> = ({
  code_data,
}) => {
  const [outputCopied, setOutputCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const languageDisplay = getLanguageDisplay(code_data.language);

  const handleCopyOutput = createCopyHandler(
    [code_data.output?.stdout, code_data.output?.stderr]
      .filter(Boolean)
      .join("\n"),
    setOutputCopied,
  );

  return (
    <div className="mt-3 w-full max-w-[30vw] rounded-3xl rounded-bl-none bg-zinc-800 p-4">
      <div className="space-y-4">
        <div className="w-full max-w-[30vw] overflow-hidden rounded-[15px] rounded-b-[20px]">
          <div className="px-1 pt-1 pb-2 text-sm font-medium text-gray-300">
            Executed Code
          </div>
          <CodeBlock className={`language-${code_data.language}`}>
            {code_data.code}
          </CodeBlock>
        </div>

        {/* Output Component */}
        <div className="w-full">
          <div className="px-1 py-2 text-sm font-medium text-gray-300">
            Output
          </div>
          <CodeExecutionOutput
            output={code_data.output}
            status={code_data.status}
            language={code_data.language}
            onCopy={handleCopyOutput}
            copied={outputCopied}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeExecutionSection;
