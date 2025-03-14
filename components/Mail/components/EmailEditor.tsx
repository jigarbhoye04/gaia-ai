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
    editor: any;
}

export const EmailEditor = ({ body, setBody, editor }: EmailEditorProps): JSX.Element => {

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