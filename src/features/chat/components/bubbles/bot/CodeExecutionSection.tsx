import React, { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/shadcn/accordion";
import CodeBlock from "@/features/chat/components/code-block/CodeBlock";
import { CodeData } from "@/types/features/toolDataTypes";

import ChartDisplay from "./ChartDisplay";
import CodeExecutionOutput from "./CodeExecutionOutput";

interface CodeExecutionSectionProps {
  code_data: CodeData;
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

  const handleCopyOutput = createCopyHandler(
    [
      code_data.output?.stdout,
      code_data.output?.stderr,
      ...(code_data.output?.results || []),
    ]
      .filter(Boolean)
      .join("\n"),
    setOutputCopied,
  );

  return (
    <div className="mt-3 w-full max-w-[30vw] rounded-3xl rounded-bl-none bg-zinc-800 p-4">
      <div className="space-y-4">
        <Accordion type="multiple" defaultValue={["output"]} className="w-full">
          {/* Executed Code Section */}
          <AccordionItem value="code" className="border-none">
            <AccordionTrigger className="text-sm font-medium text-gray-300 hover:text-white">
              Executed Code
            </AccordionTrigger>
            <AccordionContent>
              <div className="w-full max-w-[30vw] overflow-hidden rounded-[15px] rounded-b-[20px]">
                <CodeBlock className={`language-${code_data.language}`}>
                  {code_data.code}
                </CodeBlock>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Output Section */}
          <AccordionItem value="output" className="border-none">
            <AccordionTrigger className="text-sm font-medium text-gray-300 hover:text-white">
              Output
            </AccordionTrigger>
            <AccordionContent>
              <CodeExecutionOutput
                output={code_data.output}
                status={code_data.status}
                language={code_data.language}
                onCopy={handleCopyOutput}
                copied={outputCopied}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Charts Component */}
        {code_data.charts && code_data.charts.length > 0 && (
          <div className="w-full">
            <ChartDisplay charts={code_data.charts} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeExecutionSection;
