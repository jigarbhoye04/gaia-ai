import GmailBody from "@/components/Mail/GmailBody";
import { EmailData } from "@/types/mailTypes";
import { apiauth } from "@/utils/apiaxios";
import { parseEmail } from "@/utils/mailUtils";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";
import { User } from "@heroui/user";
import he from "he";
import { XIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { MagicWand05Icon, StarsIcon } from "../Misc/icons";
import { toast } from "sonner";
import { Spinner } from "@heroui/spinner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ViewEmailProps {
  mail: EmailData | null;
  onOpenChange: () => void;
}

export default function ViewEmail({ mail, onOpenChange }: ViewEmailProps) {
  const { name: nameFrom, email: emailFrom } = parseEmail(mail?.from);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    setSummary("");
  }, [mail]);

  const handleSummarize = async () => {
    if (!mail) return;
    setIsSummarizing(true);
    try {
      const response = await apiauth.post("/gmail/summarize", {
        message_id: mail.id,
        include_key_points: true,
        include_action_items: true,
        max_length: 150,
      });
      setSummary(response.data.result.response);
    } catch (error) {
      console.error("Failed to summarize email:", error);
      toast.error("Failed to summarize email. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <Drawer.Root direction="right" open={!!mail} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-md" />
        <Drawer.Content
          className="right-0 top-2 bottom-2 fixed z-10 outline-none sm:w-[50vw] w-full flex"
          style={
            { "--initial-transform": "calc(100% + 8px)" } as React.CSSProperties
          }
        >
          <div className="bg-zinc-900 h-full w-full grow p-6 pt-4 flex flex-col rounded-l-2xl overflow-y-auto relative">
            <div className="w-full relative">
              <Tooltip content="Close" color="foreground">
                <div className="cursor-pointer absolute right-0 top-0">
                  <XIcon width={18} onClick={onOpenChange} />
                </div>
              </Tooltip>
            </div>

            <header className="flex items-center gap-2 mb-3">
              <Button
                color="primary"
                className="font-medium text-primary"
                isLoading={isSummarizing}
                startContent={<MagicWand05Icon color={undefined} />}
                onPress={handleSummarize}
                variant="flat"
                size="sm"
                isDisabled={isSummarizing || !!summary}
              >
                {isSummarizing ? "Summarizing..." : "Summarize"}
              </Button>
              {/* <Button
                variant="faded"
                color="primary"
                className="font-medium"
                isDisabled
                startContent={<MagicWand05Icon color={undefined} />}
              >
                Categorize
              </Button> */}
            </header>

            {summary && (
              <div className="bg-zinc-800 outline outline-2 outline-zinc-700 p-2 w-fit rounded-xl shadow-md flex flex-col mb-3">
                <div className="text-sm font-medium text-white flex items-center gap-3 relative">
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
                <div className="text-sm text-white p-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {mail?.subject && (
              <Drawer.Title className="font-medium text-foreground">
                {mail?.subject}
              </Drawer.Title>
            )}

            <Drawer.Description className="text-foreground-600 space-y-4">
              {mail?.snippet && (
                <>
                  <p className="text-md text-muted-foreground">
                    {he.decode(mail.snippet)}
                  </p>
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
                </>
              )}

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
