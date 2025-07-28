import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { User } from "@heroui/user";
import DOMPurify from "dompurify";
import { Mail } from "lucide-react";

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
  console.log(emailThreadData);
  return (
    <div className="mx-auto mb-3 w-full max-w-4xl min-w-[700px] rounded-3xl bg-zinc-800 p-3 py-0 text-white">
      <Accordion variant="light" defaultExpandedKeys={["email-thread"]}>
        <AccordionItem
          key="email-thread"
          aria-label="Email Thread"
          title={
            <div className="flex items-center gap-3">
              <Gmail width={22} height={22} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Email Thread</span>
                <span className="text-xs text-gray-400">
                  {emailThreadData.messages_count} message
                  {emailThreadData.messages_count === 1 ? "" : "s"}
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
                    <div className="mb-4 flex w-full flex-col items-start justify-start gap-3">
                      <div className="flex w-full flex-row items-center justify-between">
                        <div className="flex flex-row items-center gap-2">
                          <Chip variant="flat" size="sm" radius="sm">
                            From
                          </Chip>
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
                      <div className="text-sm font-medium text-foreground-600">
                        {message.subject}
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
