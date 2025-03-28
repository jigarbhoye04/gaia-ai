import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { User } from "@heroui/user";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import he from "he";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Reply,
  ReplyAll,
  Send,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";

import GmailBody from "@/components/Mail/GmailBody";
import { useEmailReadStatus } from "@/components/Mail/hooks/useEmailReadStatus";
import { EmailData, EmailThreadResponse } from "@/types/mailTypes";
import { apiauth } from "@/utils/apiaxios";
import { parseEmail } from "@/utils/mailUtils";

import { MagicWand05Icon, StarsIcon } from "../Misc/icons";
import { MenuBar } from "../Notes/NotesMenuBar";

interface ViewEmailProps {
  mail: EmailData | null;
  onOpenChange: () => void;
  threadMessages?: EmailData[];
  isLoadingThread?: boolean;
}

interface EmailSummaryRequest {
  message_id: string;
  include_action_items: boolean;
  max_length?: number;
}

interface EmailSummaryResponse {
  email_id: string;
  email_subject: string;
  result: { response: string };
}

function AISummary({ summary }: { summary: string | null }) {
  if (!summary) return null;

  return (
    <>
      <div className="mb-3 flex w-fit flex-col rounded-xl bg-zinc-800 p-2 shadow-md outline outline-2 outline-zinc-700">
        <div className="relative flex items-center gap-3 text-sm font-medium text-white">
          <Chip
            classNames={{
              content:
                "text-sm relative !flex flex-row text-primary items-center gap-1 pl-3 font-medium",
            }}
            variant="flat"
            color="primary"
          >
            <StarsIcon
              width={17}
              height={17}
              color={undefined}
              fill={"#00bbff"}
            />
            <span>GAIA Email Summary</span>
          </Chip>
        </div>
        <div className="p-2 text-sm text-white">{summary}</div>
      </div>
    </>
  );
}

export default function ViewEmail({
  mail,
  onOpenChange,
  threadMessages = [],
  isLoadingThread = false,
}: ViewEmailProps) {
  const { name: nameFrom, email: emailFrom } = parseEmail(mail?.from || "");
  const [summary, setSummary] = useState<string | null>(mail?.summary || null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [replyTo, setReplyTo] = useState<EmailData | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Sort thread messages by date if available
  const sortedThreadMessages = [...threadMessages].sort((a, b) => {
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  // Get and format recipients for reply
  const getRecipients = (email: EmailData | null) => {
    if (!email) return { to: "", cc: "", bcc: "" };

    const headers = email.headers || {};
    return {
      to: headers["Reply-To"] || headers["From"] || email.from || "",
      cc: "",
      bcc: "",
    };
  };

  // TipTap editor for reply
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Typography,
      Placeholder.configure({
        placeholder: "Write your reply here...",
      }),
      CharacterCount.configure({
        limit: 10000,
      }),
    ],
    content: `<p></p>`,
  });

  // Reset editor content when opening/closing the reply form
  useEffect(() => {
    if (editor && showReplyEditor) {
      editor.commands.setContent("<p></p>");
      editor.commands.focus("end");
    }
  }, [editor, showReplyEditor]);

  const handleReply = (email: EmailData) => {
    setReplyTo(email);
    setShowReplyEditor(true);
  };

  const handleSendReply = async () => {
    if (!editor || !replyTo || !replyTo.id) return;

    const content = editor.getHTML();
    if (!content || content === "<p></p>") {
      toast.error("Please write a reply before sending");
      return;
    }

    setIsSending(true);
    try {
      const reply = {
        message_id: replyTo.id,
        thread_id: replyTo.threadId,
        body: content,
      };

      await apiauth.post("/gmail/reply", reply);

      toast.success("Reply sent successfully");
      setShowReplyEditor(false);
      editor.commands.setContent("<p></p>");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelReply = () => {
    setShowReplyEditor(false);
    setReplyTo(null);
    if (editor) {
      editor.commands.setContent("<p></p>");
    }
  };

  const handleSummarize = async () => {
    if (!mail?.id) return;

    setIsLoadingSummary(true);

    try {
      const summaryRequest: EmailSummaryRequest = {
        message_id: mail.id,
        include_action_items: true,
        max_length: 250,
      };

      const response = await apiauth.post("/gmail/summarize", summaryRequest);
      const summaryData: EmailSummaryResponse = response.data;

      setSummary(summaryData.result.response);
    } catch (error) {
      console.error("Error summarizing email:", error);
      toast.error("Failed to summarize email. Please try again.");
      setSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <Drawer.Root direction="right" open={!!mail} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-md" />
        <Drawer.Content
          className="fixed bottom-2 right-0 top-2 z-10 flex w-screen outline-none sm:w-[50vw]"
          style={
            { "--initial-transform": "calc(100% + 8px)" } as React.CSSProperties
          }
        >
          <div className="relative flex h-full w-full grow flex-col overflow-y-auto rounded-l-2xl bg-zinc-900 p-6 pt-4">
            <div className="relative w-full">
              <Tooltip content="Close" color="foreground">
                <div className="absolute right-0 top-0 cursor-pointer">
                  <XIcon width={18} onClick={onOpenChange} />
                </div>
              </Tooltip>
            </div>
            <header className="mb-2 flex items-center gap-2">
              <Button
                color="primary"
                className="font-medium"
                startContent={<MagicWand05Icon color={undefined} />}
                isLoading={isLoadingSummary}
                onPress={handleSummarize}
                isDisabled={isLoadingSummary}
              >
                {isLoadingSummary ? "Summarizing..." : "Summarise"}
              </Button>

              <div className="ml-auto flex gap-2">
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Reply size={16} />}
                  onPress={() => mail && handleReply(mail)}
                >
                  Reply
                </Button>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<ReplyAll size={16} />}
                  onPress={() => mail && handleReply(mail)}
                >
                  Reply All
                </Button>
              </div>
            </header>

            <AISummary summary={summary} />

            {mail?.subject && (
              <Drawer.Title className="font-medium text-foreground">
                {mail?.subject}
              </Drawer.Title>
            )}

            <Drawer.Description className="space-y-4 text-foreground-600">
              {isLoadingThread && (
                <div className="flex items-center justify-center py-4">
                  <Spinner size="sm" color="primary" />
                  <span className="ml-2">Loading conversation...</span>
                </div>
              )}

              {/* Thread messages */}
              {sortedThreadMessages.length > 0 ? (
                <div className="mt-4 space-y-6">
                  {sortedThreadMessages.map((message, index) => {
                    const {
                      name: messageSenderName,
                      email: messageSenderEmail,
                    } = parseEmail(message.from);
                    const isCurrentEmail = mail?.id === message.id;

                    return (
                      <div
                        key={message.id}
                        className={`rounded-lg p-4 ${isCurrentEmail ? "bg-zinc-800" : "bg-zinc-900"} border-l-2 ${isCurrentEmail ? "border-primary" : "border-zinc-700"}`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <User
                            avatarProps={{
                              src: "/profile_photo/profile_photo.webp",
                              size: "sm",
                            }}
                            description={messageSenderEmail}
                            name={messageSenderName}
                            classNames={{
                              name: "font-medium",
                              description: "text-gray-400",
                            }}
                          />
                          <div className="text-xs text-gray-400">
                            {new Date(message.time).toLocaleString()}
                          </div>
                        </div>

                        {message.snippet && (
                          <div className="text-muted-foreground mb-2 text-sm">
                            {he.decode(message.snippet)}
                          </div>
                        )}

                        <div className="mt-2">
                          <GmailBody email={message} />
                        </div>

                        <div className="mt-4 flex justify-end">
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<Reply size={14} />}
                            onPress={() => handleReply(message)}
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : mail ? (
                <>
                  {mail?.snippet && (
                    <div className="text-md text-muted-foreground">
                      {he.decode(mail.snippet)}
                    </div>
                  )}
                  <User
                    avatarProps={{
                      src: "/profile_photo/profile_photo.webp",
                      size: "sm",
                    }}
                    description={emailFrom}
                    name={nameFrom}
                    classNames={{
                      name: "font-medium",
                      description: "text-gray-400",
                    }}
                  />
                  <div>
                    <hr className="my-4 border-gray-700" />
                    <GmailBody email={mail} />
                  </div>
                </>
              ) : null}

              {/* Reply editor */}
              {showReplyEditor && replyTo && (
                <div className="mt-4 border-t-2 border-zinc-700 pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Reply to: </span>
                      <span className="text-gray-400">
                        {parseEmail(replyTo.from).name ||
                          parseEmail(replyTo.from).email}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      isIconOnly
                      onPress={handleCancelReply}
                    >
                      <XIcon size={16} />
                    </Button>
                  </div>

                  <div className="rounded-lg border border-zinc-700 bg-zinc-800">
                    <MenuBar editor={editor} />
                    <div className="max-h-[250px] min-h-[150px] overflow-y-auto px-4 py-2">
                      <EditorContent editor={editor} />
                    </div>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <Button
                      color="primary"
                      startContent={<Send size={16} />}
                      onPress={handleSendReply}
                      isLoading={isSending}
                      isDisabled={isSending}
                    >
                      {isSending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              )}
            </Drawer.Description>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
