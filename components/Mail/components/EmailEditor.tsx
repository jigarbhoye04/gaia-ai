import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { MenuBar } from "@/components/Notes/NotesMenuBar";
import { useState } from "react";

interface EmailEditorProps {
    body: string;
    setBody: (body: string) => void;
}

export const EmailEditor = ({ body, setBody }: EmailEditorProps): JSX.Element => {
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
                class: "h-[40vh] overflow-y-auto",
            },
        },
        content: body,
        onUpdate: ({ editor }) => {
            setBody(editor.getHTML());
        },
    });

    return (
        <>
            {editor && (
                <>
                    <MenuBar editor={editor} textLength={false} isEmail={true} />
                    <EditorContent className="bg-zinc-800 p-2" editor={editor} />
                </>
            )}
        </>
    );
}; 