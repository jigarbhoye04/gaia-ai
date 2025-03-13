import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/useUser";
import { apiauth } from "@/utils/apiaxios";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { ButtonGroup } from "@heroui/react";
import { Tag, TagInput } from "emblor";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { AiSearch02Icon, BrushIcon, Sent02Icon, SentIcon } from "../Misc/icons";
import { Textarea } from "../ui/textarea";
import { AiSearchModal } from "./AiSearchModal";
import { EmailSuggestion } from "./EmailChip";
import { Button as ShadcnButton } from "../ui/button";

interface MailComposeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MailCompose({
  open,
  onOpenChange,
}: MailComposeProps): JSX.Element {
  const user = useUser();
  const [toEmails, setToEmails] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [writingStyle, setWritingStyle] = useState("formal");
  const [isWritingStyleMenuOpen, setIsWritingStyleMenuOpen] = useState(false);
  // For future use (e.g., Personalise menu)
  // const [isPersonaliseMenuOpen, setIsPersonaliseMenuOpen] = useState(false);

  const writingStyles = [
    { id: "formal", label: "Formal" },
    { id: "friendly", label: "Friendly" },
    { id: "casual", label: "Casual" },
    { id: "persuasive", label: "Persuasive" },
    { id: "humorous", label: "Humorous" },
  ];

  const handleAiSelect = (selectedSuggestions: EmailSuggestion[]) => {
    const newTags: Tag[] = selectedSuggestions.map((s) => ({
      id: s.email,
      label: s.email,
      text: s.email,
    }));
    setToEmails((prev) => [...prev, ...newTags]);
  };

  const handleAskGaia = async () => {
    setLoading(true);
    try {
      const res = await apiauth.post("/mail/ai/compose", {
        subject,
        body,
        prompt,
      });
      const response = JSON.parse(res.data.result.response);
      setAiResponse(response);
      setBody(response.body);
      setSubject(response.subject);
    } catch (error) {
      console.error("Error processing email:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskGaiaKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAskGaia();
    }
  };

  return (
    <>
      <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay
            className={`fixed inset-0 bg-black/40 backdrop-blur-sm ${
              isAiModalOpen ? "pointer-events-auto" : "pointer-events-none"
            }`}
          />
          <Drawer.Content className="bg-zinc-900 fixed right-0 bottom-0 w-[50vw] min-h-[70vh] z-[10] rounded-tl-xl p-4 flex flex-col gap-2">
            <Drawer.Title className="text-xl">New Message</Drawer.Title>

            <Input
              variant="underlined"
              startContent={
                <div className="text-sm text-foreground-500 w-[50px] flex justify-center">
                  From
                </div>
              }
              disabled
              value={user.email}
              className="bg-zinc-800"
            />

            <div className="relative">
              <TagInput
                styleClasses={{
                  inlineTagsContainer:
                    "bg-zinc-800 border border-t-0 border-x-0 !border-b-zinc-600 border-b-2 p-2 rounded-none",
                  tag: { body: "p-0 bg-white/20 pl-3 text-sm border-none" },
                }}
                shape="pill"
                animation="fadeIn"
                placeholder="To"
                tags={toEmails}
                setTags={setToEmails}
                activeTagIndex={activeTagIndex}
                setActiveTagIndex={setActiveTagIndex}
              />
              <Button
                isIconOnly
                className="absolute right-[3px] top-[3px]"
                size="sm"
                color="primary"
                onPress={() => setIsAiModalOpen(true)}
              >
                <AiSearch02Icon width={19} />
              </Button>
            </div>

            <Input
              placeholder="Subject"
              variant="underlined"
              className="bg-zinc-800"
              classNames={{ innerWrapper: "px-2" }}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <div className="relative h-full w-full flex-1 flex flex-col">
              <div className="flex pb-2 gap-3 justify-end w-full z-[2]">
                <div className="relative">
                  {/* {isWritingStyleMenuOpen && (
                    <DropdownMenuContent className="z-[50] absolute mt-2 w-40">
                      {writingStyles.map((style) => (
                        <DropdownMenuItem
                          key={style.id}
                          onClick={() => {
                            setWritingStyle(style.id);
                            setIsWritingStyleMenuOpen(false);
                          }}
                        >
                          {style.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  )} */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <ShadcnButton
                        className="font-normal text-sm text-[#00bbff] bg-[#00bbff40] hover:bg-[#00bbff20] outline-none border-none ring-0"
                        size={"sm"}
                      >
                        <div className="flex flex-row gap-1">
                          <BrushIcon width={20} height={20} color={undefined} />
                          Writing Style:{" "}
                          {
                            writingStyles.find((s) => s.id === writingStyle)
                              ?.label
                          }
                          <ChevronDown width={20} />
                        </div>
                      </ShadcnButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="dark bg-zinc-900 border-none text-white">
                      {writingStyles.map((style) => (
                        <DropdownMenuItem
                          key={style.id}
                          onClick={() => {
                            setWritingStyle(style.id);
                            setIsWritingStyleMenuOpen(false);
                          }}
                          className="cursor-pointer focus:bg-zinc-600 focus:text-white"
                        >
                          <div className="flex justify-between w-full items-center">
                            {style.label}

                            {writingStyles.find((s) => s.id === writingStyle)
                              ?.label == style.label && (
                              <Check width={20} height={20} />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/*
                // Example for another controlled menu (e.g., Personalise):
                <div className="relative">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="font-medium text-[#00bbff] bg-[#00bbff40]"
                    onClick={() =>
                      setIsPersonaliseMenuOpen((prev) => !prev)
                    }
                  >
                    <PaletteIcon width={20} height={20} />
                    Personalise <ChevronDown width={20} />
                  </Button>
                  {isPersonaliseMenuOpen && (
                    <DropdownMenuContent className="z-[50] absolute mt-2">
                      <DropdownMenuItem onClick={() => }>
                        New file
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  )}
                </div>
                */}
              </div>
              <Textarea
                placeholder="Body"
                className="bg-zinc-800 flex-1 p-2 rounded-none border-none outline-none focus-visible:!ring-0 text-white ring-0 mb-2"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <footer className="flex w-full justify-end gap-5">
              <Input
                placeholder="What is the email about?"
                radius="full"
                classNames={{ inputWrapper: "pr-1 pl-0" }}
                className="pr-1"
                variant="faded"
                size="lg"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleAskGaiaKeyPress}
                startContent={<div className="pingspinner size-[20px]" />}
                endContent={
                  <Button
                    isIconOnly
                    color="primary"
                    radius="full"
                    onPress={handleAskGaia}
                  >
                    <SentIcon color={undefined} />
                  </Button>
                }
              />

              <div className="flex items-center gap-2">
                <ButtonGroup color="primary">
                  <Button className="text-medium">
                    Send
                    <Sent02Icon width={23} height={23} />
                  </Button>
                  {/*
                  // Additional controlled menus (e.g., schedule send) can be added here similarly.
                  */}
                </ButtonGroup>
              </div>
            </footer>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      <AiSearchModal
        open={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
        onSelect={handleAiSelect}
      />
    </>
  );
}
