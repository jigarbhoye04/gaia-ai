import { Spinner } from "@heroui/spinner";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { convert } from "html-to-text";
import { ArrowLeft, CircleX, Trash2, TriangleAlert } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import BubbleMenuComponent from "@/components/Notes/BubbleMenu";
import { MenuBar } from "@/components/Notes/NotesMenuBar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiauth } from "@/utils/apiaxios";
import { SaveIcon } from "@/components/Misc/icons";

interface Note {
  id: string;
  title: string;
  content: string;
  plaintext: string;
}

export default function NotesAdd() {
  const router = useRouter();
  const { id } = router.query;
  const [note, setNote] = useState<Note>({
    id: "",
    title: "",
    content: "",
    plaintext: "",
  });
  const [oldNote, setOldNote] = useState<Note>({
    id: "",
    title: "",
    content: "",
    plaintext: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Typography,
      Underline,
      CharacterCount.configure({ limit: 10_000 }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Enter a title for your note";
          }

          return "Write something for GAIA to remember...";
        },
      }),
    ],
    content: note.content,
    onUpdate: ({ editor }) => {
      const noteContent = editor.getHTML();

      if (noteContent.length === 9500) {
        toast.custom(() => (
          <div className="bg-[#ffecd8] list-none py-2 px-4 rounded-md flex flex-row items-center gap-3 text-[#dc7609] font-medium w-full justify-evenly text-nowrap">
            <TriangleAlert
              className="min-w-[30px]"
              color="#ffecd8"
              fill="#dc7609"
              height={30}
              width={30}
            />
            <span>
              You are reaching the maximum character limit of a note. (10k
              characters)
            </span>
          </div>
        ));
      } else if (noteContent.length === 10_000) {
        toast.custom(() => (
          <div className="bg-[#ffe1e1] list-none py-2 px-4 rounded-md flex flex-row items-center gap-3 text-[#e60000] font-medium w-full justify-evenly text-nowrap">
            <CircleX
              className="min-w-[30px]"
              color="#ffe1e1"
              fill="#e60000"
              height={30}
              width={30}
            />
            <span>
              You have reached the maximum character limit of a note. (10k
              characters)
            </span>
          </div>
        ));
      }

      setNote((prev) => ({ ...prev, content: noteContent }));
    },
  });

  const unsavedChanges = useMemo(() => {
    return (
      note !== oldNote && editor?.storage?.characterCount?.characters() > 0
    );
  }, [note, oldNote, editor]);

  useEffect(() => {
    setHasUnsavedChanges(unsavedChanges);
  }, [unsavedChanges]);

  const fetchNote = useCallback(async () => {
    if (id) {
      try {
        const response = await apiauth.get(`/notes/${id}`);
        const fetchedNote = response.data as Note; // Type cast the response

        setNote(fetchedNote);
        setOldNote(fetchedNote);
        setHasUnsavedChanges(false);
        editor?.commands.setContent(fetchedNote.content);
      } catch (error) {
        console.error("Error fetching note:", error);
      }
    }
    setIsLoading(false);
  }, [id, editor]);

  useEffect(() => {
    if (router.pathname === "/notes/add") {
      setIsLoading(false);
    } else {
      fetchNote();
    }
  }, [router.pathname, fetchNote]);

  const saveNote = async () => {
    try {
      setIsSaving(true);
      const method = id ? "PUT" : "POST";
      const url = id ? `/notes/${id}` : `/notes`;

      await apiauth[method.toLowerCase() as "put" | "post"](url, {
        content: note.content,
        plaintext: convert(note.content),
      });

      toast.success("Note has been saved");
      setOldNote(note);

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Uh oh! Something went wrong.", {
        classNames: {
          toast: "flex items-center p-3 rounded-xl gap-3 w-[350px] toast_error",
          title: " text-sm",
          description: "text-sm",
        },
        duration: 3000,
        description:
          "There was a problem with saving this Note. Please try again later.\n",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async () => {
    try {
      await apiauth.delete(`/notes/${id}`);
      toast.success("Note has been deleted");
      router.push("/notes");
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Uh oh! Something went wrong.", {
        classNames: {
          toast: "flex items-center p-3 rounded-xl gap-3 w-[350px] toast_error",
          title: " text-sm",
          description: "text-sm",
        },
        duration: 3000,
        description:
          "There was a problem with deleting this Note. Please try again later.\n",
      });
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-screen h-screen w-full">
      <div className="flex w-full justify-between items-center dark">
        <Link href="/notes">
          <Button
            className="text-white w-fit gap-1 px-0 font-normal"
            variant={"link"}
          >
            <ArrowLeft width={17} />
            All Notes
          </Button>
        </Link>

        <Suspense fallback={<Spinner />}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="hover:bg-zinc-800 hover:text-white"
              >
                <DotsVerticalIcon height={20} width={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-zinc-800 border-none hover:!bg-zinc-900 p-0"
            >
              <DropdownMenuItem
                className="text-red-500 hover:!bg-zinc-900 hover:!text-red-500 p-3 cursor-pointer"
                onClick={deleteNote}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Suspense>
      </div>

      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="min-h-screen h-screen pt-3 flex flex-col editor">
          {editor && (
            <>
              <BubbleMenuComponent editor={editor} />
              <MenuBar editor={editor} />
              <EditorContent className="min-h-screen" editor={editor} />
            </>
          )}
        </div>
      )}

      <div
        className={`fixed bottom-4 right-4 bg-zinc-800 p-5 rounded-lg shadow-lg transition-all duration-200 ${
          hasUnsavedChanges
            ? "opacity-100 pointer-events-auto scale-100"
            : "opacity-0 pointer-events-none scale-80"
        }`}
      >
        <p className="text-white mb-2 font-medium text-lg">
          You have unsaved changes!
        </p>
        <Button
          disabled={!hasUnsavedChanges || isSaving}
          className="bg-[#00bbff] hover:bg-[#7bdcff] text-zinc-800 flex gap-2"
          onClick={saveNote}
        >
          <SaveIcon />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
