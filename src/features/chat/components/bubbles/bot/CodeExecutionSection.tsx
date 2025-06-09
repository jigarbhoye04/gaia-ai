import { ChevronDown, ChevronRight, Code2, Terminal } from "lucide-react";
import React, { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/shadcn/accordion";
import { Badge } from "@/components/ui/shadcn/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/shadcn/card";

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

const CodeExecutionSection: React.FC<CodeExecutionSectionProps> = ({
  code_data,
}) => {
  const [codeExpanded, setCodeExpanded] = useState(false);

  // Language badge colors
  const getLanguageBadgeVariant = (language: string) => {
    switch (language.toLowerCase()) {
      case "python":
        return "default";
      case "javascript":
        return "secondary";
      case "typescript":
        return "outline";
      case "ruby":
        return "destructive";
      case "php":
        return "default";
      default:
        return "secondary";
    }
  };

  // Status badge variant
  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "executing":
        return "secondary";
      case "completed":
        return "default";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className="border-muted mb-4 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Code Execution</span>
            <Badge variant={getLanguageBadgeVariant(code_data.language)}>
              {code_data.language}
            </Badge>
            {code_data.status && (
              <Badge variant={getStatusBadgeVariant(code_data.status)}>
                {code_data.status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="w-full">
          {/* Code Accordion */}
          <AccordionItem value="code" className="border-none">
            <AccordionTrigger
              className="py-2 hover:no-underline"
              onClick={() => setCodeExpanded(!codeExpanded)}
            >
              <div className="flex items-center gap-2 text-sm">
                {codeExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>View Code</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-muted/50 rounded-md p-3">
                <pre className="overflow-x-auto">
                  <code className="text-xs">{code_data.code}</code>
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Output Section - Always visible */}
        {code_data.output && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <Terminal className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Output</span>
              {code_data.output.exit_code !== 0 && (
                <Badge variant="destructive" className="text-xs">
                  Exit Code: {code_data.output.exit_code}
                </Badge>
              )}
            </div>
            <div className="rounded-md bg-black/90 p-4 font-mono text-xs text-green-400">
              {/* Standard Output */}
              {code_data.output.stdout && (
                <div className="whitespace-pre-wrap">
                  {code_data.output.stdout}
                </div>
              )}

              {/* Standard Error */}
              {code_data.output.stderr && (
                <div className="mt-2 whitespace-pre-wrap text-red-400">
                  {code_data.output.stderr}
                </div>
              )}

              {/* Show message if no output */}
              {!code_data.output.stdout && !code_data.output.stderr && (
                <div className="text-gray-500">No output</div>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {code_data.status === "executing" && !code_data.output && (
          <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Executing code...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CodeExecutionSection;
