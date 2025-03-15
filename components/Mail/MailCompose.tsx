import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Tag } from "emblor";
import { convert } from "html-to-text";
import { AlertCircle } from "lucide-react";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { AttachmentIcon, Sent02Icon } from "../Misc/icons";
import { AiSearchModal } from "./AiSearchModal";
import { EmailSuggestion } from "./EmailChip";
import { AIDraftInput } from "./AIDraftInput";
import { ClarityDropdown } from "./ClarityDropdown";
import { ContentLengthDropdown } from "./ContentLengthDropdown";
import { EmailEditor } from "./EmailEditor";
import { EmailRecipients } from "./EmailRecipients";
import { FileAttachments } from "./FileAttachments";
import { WritingStyleDropdown } from "./WritingStyleDropdown";
import { MenuBar } from "../Notes/NotesMenuBar";

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
  const [ccEmails, setCcEmails] = useState<Tag[]>([]);
  const [bccEmails, setBccEmails] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [writingStyle, setWritingStyle] = useState("formal");
  const [contentLength, setContentLength] = useState("none");
  const [clarityOption, setClarityOption] = useState("none");
  const [error, setError] = useState<string | null>(null);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sendLoading, setSendLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorContentSetRef = useRef(false);

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
        placeholder: () => "Body",
      }),
    ],
    editorProps: {
      attributes: {
        class: "min-h-[40vh] h-fit text-sm overflow-hidden",
      },
    },
    content: "",
    // onUpdate: ({ editor }) => {
    //   // Only update body state from editor when user is typing
    //   // not when we programmatically update the editor
    //   if (!editorContentSetRef.current) {
    //     setBody(editor.getHTML());
    //   } else {
    //     editorContentSetRef.current = false;
    //   }
    // },
  });

  // This effect runs when body state changes from external sources (like AI)
  useEffect(() => {
    if (editor && !editor.isDestroyed && body) {
      // Set a flag to prevent feedback loop with onUpdate
      editorContentSetRef.current = true;
      editor.commands.setContent(body);
    }
  }, [body, editor]);

  const handleAiSelect = (selectedSuggestions: EmailSuggestion[]) => {
    const newTags: Tag[] = selectedSuggestions.map((s) => ({
      id: s.email,
      label: s.email,
      text: s.email,
    }));
    setToEmails((prev) => [...prev, ...newTags]);
  };

  const handleAskGaia = async (overrideStyle?: string | { id: string }) => {
    setError(null);
    if (prompt.length == 0 && body.length == 0) return;
    setLoading(true);
    try {
      const selectedStyle = typeof overrideStyle === 'string'
        ? overrideStyle
        : (overrideStyle?.id || writingStyle);

      const requestData = {
        subject,
        // Get content directly from editor if available
        body: editor ? convert(editor.getHTML()) : convert(body),
        prompt,
        writingStyle: selectedStyle,
        contentLength,
        clarityOption,
      };

      const res = await apiauth.post("/mail/ai/compose", requestData);
      try {
        const response = res.data;
        setSubject(response.subject);
        setBody(response.body.replace(/\n/g, "<br />"));
      } catch (error) {
        console.error("Error parsing response:", error);
        setError("Failed to parse response");
      }
    } catch (error) {
      console.error("Error processing email:", error);
      toast.error("Error processing email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
      // Reset the input value so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = async () => {
    if (toEmails.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    setSendLoading(true);
    try {
      const formData = new FormData();

      // Add recipients
      formData.append('to', toEmails.map(tag => tag.text).join(','));
      formData.append('subject', subject);

      // Get the latest HTML directly from the editor if available
      const emailBody = editor ? editor.getHTML() : body;

      // Gmail API expects an HTML content flag for proper rendering
      formData.append('body', emailBody);
      formData.append('contentType', 'text/html'); // Explicitly specify content type as HTML

      // Add CC and BCC if present
      if (ccEmails.length > 0) {
        formData.append('cc', ccEmails.map(tag => tag.text).join(','));
      }

      if (bccEmails.length > 0) {
        formData.append('bcc', bccEmails.map(tag => tag.text).join(','));
      }

      // Add all attachments
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await apiauth.post('/gmail/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success("Email sent successfully!");
      onOpenChange(false);

      // Reset form
      setToEmails([]);
      setCcEmails([]);
      setBccEmails([]);
      setSubject("");
      setBody("");
      if (editor) editor.commands.setContent("");
      setAttachments([]);

    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <>
      <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay
            className={`fixed inset-0 bg-black/40 backdrop-blur-md ${isAiModalOpen ? "pointer-events-auto" : "pointer-events-none"
              }`}
          />
          <Drawer.Content className="bg-zinc-900 fixed right-0 bottom-0 w-[50vw] min-h-[80vh] z-[10] rounded-tl-xl p-4 flex flex-col gap-2">
            <Drawer.Title className="text-xl">New Message</Drawer.Title>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>There was an error.</AlertTitle>
                <AlertDescription className="max-h-20 overflow-y-auto">{error}</AlertDescription>
              </Alert>
            )}

            {/* <Input
              variant="underlined"
              size="sm"
              startContent={
                <div className="text-sm text-foreground-500 w-[50px] flex justify-center">
                  From
                </div>
              }
              disabled
              value={user.email}
              className="bg-zinc-800"
            /> */}

            <EmailRecipients
              toEmails={toEmails}
              setToEmails={setToEmails}
              ccEmails={ccEmails}
              setCcEmails={setCcEmails}
              bccEmails={bccEmails}
              setBccEmails={setBccEmails}
              showCcBcc={showCcBcc}
              setShowCcBcc={setShowCcBcc}
              activeTagIndex={activeTagIndex}
              setActiveTagIndex={setActiveTagIndex}
              onOpenAiModal={() => setIsAiModalOpen(true)}
            />

            <Input
              placeholder="Subject"
              variant="underlined"
              className="bg-zinc-800"
              classNames={{ innerWrapper: "px-2" }}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <div className="relative h-full w-full flex flex-col">
              <div className="h-[50vh] overflow-y-auto bg-zinc-800">
                <EmailEditor body={body} setBody={setBody} editor={editor} />
                <FileAttachments
                  attachments={attachments}
                  onRemove={handleRemoveAttachment}
                />
              </div>
              <MenuBar editor={editor} textLength={false} isEmail={true} />
              <div className="flex pt-2 gap-3 justify-start w-full z-[2] flex-wrap">
                <WritingStyleDropdown
                  writingStyle={writingStyle}
                  setWritingStyle={setWritingStyle}
                  handleAskGaia={handleAskGaia}
                />
                <ContentLengthDropdown
                  contentLength={contentLength}
                  setContentLength={setContentLength}
                  handleAskGaia={handleAskGaia}
                />
                <ClarityDropdown
                  clarityOption={clarityOption}
                  setClarityOption={setClarityOption}
                  handleAskGaia={handleAskGaia}
                />
              </div>
            </div>

            <footer className="flex w-full justify-between items-center gap-5 mt-2">
              <AIDraftInput
                prompt={prompt}
                setPrompt={setPrompt}
                handleAskGaia={handleAskGaia}
                loading={loading}
              />

              <div className="flex gap-3 items-center">
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="light"
                    onPress={handleAttachmentClick}
                    className="text-gray-400"
                    startContent={<AttachmentIcon color={undefined} width={20} height={20} />}
                  >
                    Add Files
                  </Button>
                </div>

                <ButtonGroup color="primary">
                  <Button
                    className="text-medium"
                    onPress={handleSendEmail}
                    isLoading={sendLoading}
                    isDisabled={sendLoading || toEmails.length === 0}
                  >
                    Send
                    <Sent02Icon color={undefined} width={23} height={23} />
                  </Button>
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