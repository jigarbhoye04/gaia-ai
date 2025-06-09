import { CheckCircle, Terminal, XCircle } from "lucide-react";
import React from "react";

import CopyButton from "@/features/chat/components/code-block/CopyButton";

interface CodeExecutionOutputProps {
  output?: {
    stdout: string;
    stderr: string;
    exit_code: number;
  } | null;
  status?: "executing" | "completed" | "error";
  language: string;
  onCopy: () => void;
  copied: boolean;
}

const CodeExecutionOutput: React.FC<CodeExecutionOutputProps> = ({
  output,
  status,
  language,
  onCopy,
  copied,
}) => {
  const getStatusIcon = () => {
    if (status === "executing") {
      return (
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      );
    }
    if (status === "error" || (output && output.exit_code !== 0)) {
      return <XCircle className="h-3 w-3 text-red-400" />;
    }
    if (status === "completed" && output && output.exit_code === 0) {
      return <CheckCircle className="h-3 w-3 text-green-400" />;
    }
    return <Terminal className="h-3 w-3 text-gray-400" />;
  };

  const getStatusText = () => {
    if (status === "executing") return "Running";
    if (status === "error" || (output && output.exit_code !== 0))
      return "Failed";
    if (status === "completed" && output && output.exit_code === 0)
      return "Success";
    return "Output";
  };

  const shouldShowCopyButton = output && (output.stdout || output.stderr);

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-zinc-800">
      {/* Header */}
      <div className="p flex items-center justify-between bg-zinc-900 px-4 py-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-200">
            {getStatusText()}
          </span>
        </div>
        {shouldShowCopyButton && (
          <CopyButton copied={copied} onPress={onCopy} />
        )}
      </div>

      {/* Content */}
      <div className="bg-zinc-900 p-3 pt-0">
        {status === "executing" && !output ? (
          <div className="flex items-center gap-3 py-4 text-gray-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
            <span className="text-sm">Executing {language} code...</span>
          </div>
        ) : output ? (
          <div className="space-y-3">
            {/* Standard Output */}
            {output.stdout && (
              <div className="bg-black p-3 font-mono text-sm text-green-400">
                <pre className="whitespace-pre-wrap">{output.stdout}</pre>
              </div>
            )}

            {/* Standard Error */}
            {output.stderr && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500">ERROR</div>
                <div className="bg-black p-3 font-mono text-sm text-red-400">
                  <pre className="whitespace-pre-wrap">{output.stderr}</pre>
                </div>
              </div>
            )}

            {/* Exit Code */}
            <div className="flex items-center justify-between border-t border-zinc-700 pt-3 text-xs text-gray-500">
              <span>Exit code: {output.exit_code}</span>
              {output.exit_code === 0 ? (
                <span className="text-green-400">Success</span>
              ) : (
                <span className="text-red-400">Failed</span>
              )}
            </div>

            {/* No output message */}
            {!output.stdout && !output.stderr && (
              <div className="py-4 text-center text-sm text-gray-500">
                No output produced
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-gray-500">
            Ready to execute
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeExecutionOutput;
