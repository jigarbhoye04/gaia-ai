import { Tab, Tabs } from "@heroui/tabs";
import { Code2, Terminal } from "lucide-react";
import React, { useState } from "react";

import CopyButton from "@/features/chat/components/code-block/CopyButton";

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

// Constants for styling
const LANGUAGE_COLORS = {
  python: "text-blue-400",
  javascript: "text-yellow-400",
  typescript: "text-blue-500",
  ruby: "text-red-400",
  php: "text-purple-400",
  default: "text-gray-400",
} as const;

const STATUS_CONFIGS = {
  executing: {
    className: "flex items-center gap-2 bg-yellow-400/30 text-yellow-400",
    icon: (
      <div className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
    ),
    text: "Executing...",
  },
  error: {
    className: "flex items-center gap-2 text-red-400",
    icon: <div className="h-2 w-2 rounded-full bg-red-400" />,
    text: "Error",
  },
  completed: {
    className:
      "flex items-center gap-2 rounded-full bg-green-400/20 px-3 py-1 text-green-400",
    icon: <div className="h-2 w-2 rounded-full bg-green-400" />,
    text: "Completed",
  },
} as const;

// Utility functions
const getLanguageColor = (language: string): string => {
  return (
    LANGUAGE_COLORS[language.toLowerCase() as keyof typeof LANGUAGE_COLORS] ||
    LANGUAGE_COLORS.default
  );
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

// Sub-components
const StatusIndicator: React.FC<{ status?: string }> = ({ status }) => {
  if (!status || !STATUS_CONFIGS[status as keyof typeof STATUS_CONFIGS])
    return null;

  const config = STATUS_CONFIGS[status as keyof typeof STATUS_CONFIGS];
  return (
    <div className={config.className}>
      {config.icon}
      <span className="text-xs">{config.text}</span>
    </div>
  );
};

const CodePanel: React.FC<{
  code: string;
  language: string;
  copied: boolean;
  onCopy: () => void;
}> = ({ code, copied, onCopy }) => (
  <div className="relative">
    <div className="bg-zinc-900 p-4">
      <pre className="overflow-x-auto font-mono text-sm whitespace-pre-wrap text-gray-200">
        <code>{code}</code>
      </pre>
    </div>
    <div className="absolute top-2 right-2">
      <CopyButton copied={copied} onPress={onCopy} />
    </div>
  </div>
);

const OutputPanel: React.FC<{
  output?: {
    stdout: string;
    stderr: string;
    exit_code: number;
  } | null;
  status?: string;
  language: string;
  copied: boolean;
  onCopy: () => void;
}> = ({ output, status, language, copied, onCopy }) => (
  <div className="relative">
    <div className="bg-black p-4 font-mono text-sm">
      {status === "executing" && !output ? (
        <div className="flex items-center gap-2 text-yellow-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Executing {language} code...</span>
        </div>
      ) : output ? (
        <OutputContent output={output} />
      ) : (
        <div className="text-gray-500">No output available</div>
      )}
    </div>
    {output && (
      <div className="absolute top-2 right-2">
        <CopyButton copied={copied} onPress={onCopy} />
      </div>
    )}
  </div>
);

const OutputContent: React.FC<{
  output: {
    stdout: string;
    stderr: string;
    exit_code: number;
  };
}> = ({ output }) => (
  <>
    {/* Standard Output */}
    {output.stdout && (
      <div className="whitespace-pre-wrap text-green-400">{output.stdout}</div>
    )}

    {/* Standard Error */}
    {output.stderr && (
      <div className="mt-2 whitespace-pre-wrap text-red-400">
        {output.stderr}
      </div>
    )}

    {/* Exit code indicator */}
    {output.exit_code !== 0 && (
      <div className="mt-3 text-xs text-gray-500">
        Process exited with code {output.exit_code}
      </div>
    )}

    {/* No output message */}
    {!output.stdout && !output.stderr && (
      <div className="text-gray-500">No output</div>
    )}
  </>
);

const TabTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  indicator?: React.ReactNode;
}> = ({ icon, title, indicator }) => (
  <div className="flex items-center gap-2">
    {icon}
    <span>{title}</span>
    {indicator}
  </div>
);

const CodeExecutionSection: React.FC<CodeExecutionSectionProps> = ({
  code_data,
}) => {
  const [activeTab, setActiveTab] = useState("output");
  const [codeCopied, setCodeCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  const handleCopyCode = createCopyHandler(code_data.code, setCodeCopied);
  const handleCopyOutput = createCopyHandler(
    [code_data.output?.stdout, code_data.output?.stderr]
      .filter(Boolean)
      .join("\n"),
    setOutputCopied,
  );

  return (
    <div className="relative mt-5 w-full max-w-[30vw] overflow-hidden rounded-[15px] bg-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <Code2 className="h-4 w-4 text-gray-400" />
          <div
            className={`font-mono text-sm ${getLanguageColor(code_data.language)}`}
          >
            {code_data.language}
          </div>
        </div>
        <StatusIndicator status={code_data.status} />
      </div>

      {/* Tabs */}
      <Tabs
        className="px-0"
        selectedKey={activeTab}
        variant="underlined"
        onSelectionChange={(key) => setActiveTab(key as string)}
        classNames={{
          base: "w-full",
          tabList: "w-full px-0 bg-zinc-800",
          tab: "text-gray-300 data-[selected=true]:text-white px-0",
          panel: "p-0",
        }}
      >
        {/* Output Tab */}
        <Tab
          key="output"
          title={
            <TabTitle
              icon={<Terminal className="h-4 w-4" />}
              title="Output"
              indicator={
                code_data.output?.exit_code !== 0 && (
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                )
              }
            />
          }
        >
          <OutputPanel
            output={code_data.output}
            status={code_data.status}
            language={code_data.language}
            copied={outputCopied}
            onCopy={handleCopyOutput}
          />
        </Tab>

        {/* Code Tab */}
        <Tab
          key="code"
          title={
            <TabTitle icon={<Code2 className="h-4 w-4" />} title="Source" />
          }
        >
          <CodePanel
            code={code_data.code}
            language={code_data.language}
            copied={codeCopied}
            onCopy={handleCopyCode}
          />
        </Tab>
      </Tabs>
    </div>
  );
};

export default CodeExecutionSection;
