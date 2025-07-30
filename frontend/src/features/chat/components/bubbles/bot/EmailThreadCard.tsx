import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { User } from "@heroui/user";
import DOMPurify from "dompurify";
import { Mail } from "lucide-react";
import { useState } from "react";

import { Gmail } from "@/components";
import { EmailThreadData } from "@/types/features/mailTypes";

import { parseEmail } from "../../../../mail/utils/mailUtils";
import { Chip } from "@heroui/chip";

// Use the same formatTime function as EmailListCard
function formatTime(time: string | null): string {
  if (!time) return "Yesterday";

  const date = new Date(time);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else if (diffInHours < 48) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

interface EmailThreadCardProps {
  emailThreadData: EmailThreadData;
}

function renderEmailBody(rawBody: string) {
  if (!rawBody) {
    return <div className="text-gray-500">No content available.</div>;
  }

  // Sanitize the HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(rawBody);

  return (
    <div
      className="email-content-isolator"
      style={{
        // Complete style isolation - like an iframe
        contain: "layout style",
        isolation: "isolate",
        all: "initial",
        display: "block",

        // Set base styles for email content
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: "14px",
        lineHeight: "1.5",
        color: "#374151",
        backgroundColor: "#ffffff",
        padding: "16px",
        borderRadius: "18px",
        border: "1px solid #e5e7eb",
        overflow: "auto",

        // Ensure content doesn't inherit any external styles
        boxSizing: "border-box",
        margin: "0",
        position: "relative",
        zIndex: "1",
      }}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}

export default function EmailThreadCard({
  emailThreadData,
}: EmailThreadCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSelectionChange = (keys: any) => {
    setIsExpanded(keys.has("email-thread"));
  };

  return (
    <div
      className={`mx-auto mb-3 max-w-4xl bg-zinc-800 p-3 py-0 text-white transition-all duration-300 ${
        isExpanded ? "w-screen rounded-3xl" : "w-full rounded-2xl"
      }`}
    >
      <Accordion
        variant="light"
        defaultExpandedKeys={["email-thread"]}
        onSelectionChange={handleSelectionChange}
      >
        <AccordionItem
          key="email-thread"
          aria-label="Email Thread"
          title={
            <div className="flex items-center gap-3">
              <Gmail width={22} height={22} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  Fetched Email Thread
                </span>
              </div>
            </div>
          }
        >
          <ScrollShadow className="max-h-[50vh]">
            <div className="space-y-3">
              {emailThreadData.messages.map((message, index) => {
                const { name: senderName, email: senderEmail } = parseEmail(
                  message.from,
                );

                return (
                  <div key={message.id} className="pt-0 pb-2">
                    <div className="mb-4 flex w-full flex-col items-start justify-start gap-1">
                      <div className="flex w-full flex-row items-center justify-between">
                        <div className="flex flex-row items-center gap-2">
                          <div className="w-15">
                            <Chip variant="flat" size="sm" radius="sm">
                              From
                            </Chip>
                          </div>
                          <span className="text-sm text-foreground-600">
                            {senderName}
                          </span>
                          <span className="text-xs font-light text-foreground-400">
                            {senderEmail}
                          </span>
                        </div>
                        <span className="text-xs text-foreground-500">
                          {formatTime(message.time)}
                        </span>
                      </div>
                      <div className="flex flex-row items-center gap-2">
                        <div className="w-15">
                          <Chip variant="flat" size="sm" radius="sm">
                            Subject
                          </Chip>
                        </div>
                        <div className="text-sm font-medium text-foreground-600">
                          {message.subject}
                        </div>
                      </div>
                    </div>
                    {message.body && (
                      <div className="mt-3">
                        {renderEmailBody(message.body)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollShadow>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
