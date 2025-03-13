import { MenuBar } from "@/components/Notes/NotesMenuBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Tag, TagInput } from "emblor";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { AiSearch02Icon, BrushIcon, Sent02Icon, SentIcon } from "../Misc/icons";
import { Button as ShadcnButton } from "../ui/button";
import { AiSearchModal } from "./AiSearchModal";
import { EmailSuggestion } from "./EmailChip";
import { marked } from "marked";

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
  const [loading, setLoading] = useState(false);
  const [writingStyle, setWritingStyle] = useState("formal");
  const [error, setError] = useState(null);
  // For future use (e.g., Personalise menu)
  // const [isPersonaliseMenuOpen, setIsPersonaliseMenuOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Typography,
      Underline,

      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      CharacterCount.configure({ limit: 10_000 }),
      Placeholder.configure({
        placeholder: () => {
          return "Body";
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "h-[50vh] overflow-y-auto",
      },
    },
    content: body,
    onUpdate: ({ editor }) => {
      setBody(editor.getHTML());
    },
  });

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
  const handleAskGaia = async (overrideStyle?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiauth.post("/mail/ai/compose", {
        subject,
        body,
        prompt,
        writingStyle: overrideStyle || writingStyle,
      });

      try {
        const response = JSON.parse(res.data.result.response);
        const formattedBody = marked(response.body.replace(/\n/g, "<br />"));
        editor.commands.setContent(formattedBody);
        setSubject(response.subject);
      } catch (error) {
        setError(res.data.result.response);
      }
    } catch (error) {
      console.error("Error processing email:", error);
      toast.error("Error processing email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskGaiaKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (loading) return;
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
            className={`fixed inset-0 bg-black/40 backdrop-blur-md ${
              isAiModalOpen ? "pointer-events-auto" : "pointer-events-none"
            }`}
          />
          <Drawer.Content className="bg-zinc-900 fixed right-0 bottom-0 w-[50vw] min-h-[70vh] z-[10] rounded-tl-xl p-4 flex flex-col gap-2">
            <Drawer.Title className="text-xl">New Message</Drawer.Title>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>There was an error.</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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

            <div className="relative h-full w-full flex flex-col">
              <div className="flex pb-2 gap-3 justify-end w-full z-[2]">
                <div className="relative">
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
                            handleAskGaia(style.id);
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

              {editor && (
                <>
                  {/* <BubbleMenuComponent editor={editor} /> */}
                  <MenuBar editor={editor} textLength={false} isEmail={true} />
                  <EditorContent className="bg-zinc-800 p-2" editor={editor} />
                </>
              )}

              {/* <Textarea
                placeholder="Body"
                className="bg-zinc-800 flex-1 p-2 rounded-none border-none outline-none focus-visible:!ring-0 text-white ring-0 mb-2"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              /> */}
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
                    isIconOnly={loading}
                    color="primary"
                    radius="full"
                    onPress={() => handleAskGaia()}
                    isLoading={loading}
                  >
                    <div className="flex px-3 w-fit gap-2 items-center text-medium">
                      {!loading && (
                        <>
                          AI Draft
                          <SentIcon
                            color={undefined}
                            width={25}
                            className="min-w-[25px]"
                          />
                        </>
                      )}
                    </div>
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
