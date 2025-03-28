import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { User } from "@heroui/user";
import he from "he";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";

import GmailBody from "@/components/Mail/GmailBody";
import { useEmailReadStatus } from "@/components/Mail/hooks/useEmailReadStatus";
import { EmailData, EmailsResponse } from "@/types/mailTypes";
import { apiauth } from "@/utils/apiaxios";
import { parseEmail } from "@/utils/mailUtils";

import { MagicWand05Icon, StarsIcon } from "../Misc/icons";

interface ViewEmailProps {
  mail: EmailData | null;
  onOpenChange: () => void;
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

export default function ViewEmail({ mail, onOpenChange }: ViewEmailProps) {
  const { name: nameFrom, email: emailFrom } = parseEmail(mail?.from);
  const [summary, setSummary] = useState<string | null>(mail?.summary || null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

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
            </header>

            <AISummary summary={summary} />

            {/* <div className="flex items-center gap-4"> */}
            {/* <Chip
                className="flex w-fit py-6 mb-2 overflow-hidden"
                radius="sm"
                variant="flat"
              >
                <div className="absolute inset-0 border-l-[3px] border-primary" />
                <div className="text-xs space-x-1 ">
                  <span className="text-gray-300 font-medium">To:</span>
                  <span className="text-gray-400">{emailFrom}</span>
                </div>
                <div className="font-medium">{nameFrom}</div>
              </Chip>

              <Chip
                className="flex w-fit py-6 mb-2 overflow-hidden"
                radius="sm"
                variant="flat"
              >
                <div className="absolute inset-0 border-l-[4px] border-success" />
                <div className="text-xs space-x-1 ">
                  <span className="text-gray-300 font-medium">To:</span>
                  <span className="text-gray-400">{emailTo}</span>
                </div>
                <div className="font-medium">{nameTo}</div>
              </Chip>
            /* </div>
               */}

            {mail?.subject && (
              <Drawer.Title className="font-medium text-foreground">
                {mail?.subject}
              </Drawer.Title>
            )}

            <Drawer.Description className="space-y-4 text-foreground-600">
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

              {mail && (
                <div>
                  <hr className="my-4 border-gray-700" />
                  <GmailBody email={mail} />
                </div>
              )}
            </Drawer.Description>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
