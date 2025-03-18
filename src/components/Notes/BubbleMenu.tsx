import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
} from "lucide-react";
import { lazy, Suspense } from "react";

import SuspenseLoader from "../Misc/SuspenseLoader";

const BubbleMenu = lazy(() =>
  import("@tiptap/react").then((module) => ({ default: module.BubbleMenu })),
);

const BubbleMenuComponent = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <Suspense fallback={<SuspenseLoader />}>
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex w-fit gap-5 bg-zinc-950 px-3 py-1 rounded-md">
          <button
            className={editor.isActive("bold") ? "is-active" : ""}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            B
          </button>

          <button
            className={`${
              editor.isActive("italic") ? "is-active" : ""
            } !font-serif italic`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            I
          </button>

          <button
            className={`${
              editor.isActive("paragraph") ? "is-active" : ""
            } !font-serif`}
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            P
          </button>

          <button
            className={
              editor.isActive("heading", { level: 1 }) ? "is-active" : ""
            }
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 />
          </button>

          <button
            className={
              editor.isActive("heading", { level: 2 }) ? "is-active" : ""
            }
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 />
          </button>

          <button
            className={
              editor.isActive("heading", { level: 3 }) ? "is-active" : ""
            }
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 />
          </button>

          <button
            className={
              editor.isActive("heading", { level: 4 }) ? "is-active" : ""
            }
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
          >
            <Heading4 />
          </button>

          <button
            className={
              editor.isActive("heading", { level: 5 }) ? "is-active" : ""
            }
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 5 }).run()
            }
          >
            <Heading5 />
          </button>

          <button
            className={
              editor.isActive("heading", { level: 6 }) ? "is-active" : ""
            }
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 6 }).run()
            }
          >
            <Heading6 />
          </button>
        </div>
      </BubbleMenu>
    </Suspense>
  );
};

export default BubbleMenuComponent;
