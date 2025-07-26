import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { User } from "@heroui/user";
import { ChevronDown, Mail } from "lucide-react";
import { useState } from "react";
import DOMPurify from "dompurify";
import parse from "html-react-parser";

import { Gmail } from "@/components";
import { EmailThreadData } from "@/types/features/mailTypes";

import { parseEmail } from "../../../../mail/utils/mailUtils";
import { parseDate } from "@/utils/date/dateUtils";

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
        borderRadius: "8px",
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
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set(
      emailThreadData.messages.length > 0
        ? [emailThreadData.messages[0].id]
        : [],
    ),
  );

  return (
    <div className="mx-auto mb-3 w-full max-w-4xl rounded-3xl bg-zinc-800 p-4 text-white">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
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
      </div>

      {/* Messages */}
      <ScrollShadow className="max-h-[50vh]">
        <Accordion
          variant="splitted"
          selectionMode="multiple"
          selectedKeys={selectedMessages}
          onSelectionChange={(keys) =>
            setSelectedMessages(new Set(keys as Set<string>))
          }
          className="px-0"
        >
          {emailThreadData.messages.map((message, index) => {
            const { name: senderName, email: senderEmail } = parseEmail(
              message.from,
            );

            return (
              <AccordionItem
                key={message.id}
                aria-label={`Email from ${senderName || senderEmail}`}
                title={
                  <div className="flex w-full items-center justify-between pr-4">
                    <div className="flex items-center gap-3">
                      <User
                        name={
                          <div className="flex items-center gap-3">
                            {senderName}{" "}
                            <span className="text-xs font-light text-foreground-400">
                              {senderEmail}
                            </span>
                          </div>
                        }
                        description={message.subject || "No subject"}
                        avatarProps={{
                          size: "sm",
                          src: "/profile_photo/profile_photo.webp",
                          fallback: <Mail size={16} />,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {parseDate(message.time)}
                      </span>
                    </div>
                  </div>
                }
              >
                {message.body && (
                  <div className="p-3">{renderEmailBody(message.body)}</div>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollShadow>
    </div>
  );
}
