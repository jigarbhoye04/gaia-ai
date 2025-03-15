import { EditorContent } from "@tiptap/react";

interface EmailEditorProps {
    body: string;
    setBody: (body: string) => void;
    editor: any;
}

export const EmailEditor = ({ body, setBody, editor }: EmailEditorProps): JSX.Element => {

    return (
        <>
            {editor && (
                <EditorContent className="p-2" editor={editor} />
            )}
        </>
    );
}; 