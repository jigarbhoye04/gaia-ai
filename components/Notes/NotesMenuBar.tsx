import { DashIcon } from "@radix-ui/react-icons";
import { List, ListOrdered, Redo2, Undo2 } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const TextTypeSelector = () => {
    const currentTextType = editor.isActive("paragraph")
      ? "Paragraph"
      : editor.isActive("heading", { level: 1 })
        ? "Heading 1"
        : editor.isActive("heading", { level: 2 })
          ? "Heading 2"
          : editor.isActive("heading", { level: 3 })
            ? "Heading 3"
            : editor.isActive("heading", { level: 4 })
              ? "Heading 4"
              : editor.isActive("heading", { level: 5 })
                ? "Heading 5"
                : editor.isActive("heading", { level: 6 })
                  ? "Heading 6"
                  : "Paragraph";

    const handleSelect = (value: string) => {
      if (value === "paragraph") {
        editor.chain().focus().setParagraph().run();
      } else if (value.startsWith("heading-")) {
        const level = Number.parseInt(value.split("-")[1]);

        editor.chain().focus().toggleHeading({ level }).run();
      }
    };

    return (
      <Select
        defaultValue={currentTextType.toLowerCase().replace(" ", "-")}
        onValueChange={handleSelect}
      >
        <SelectTrigger className="outline-none border-none focus:!border-none w-fit space-x-3 hover:bg-black/30 focus:bg-black/30">
          <SelectValue placeholder="Select Text Type" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-none text-foreground-300 active:bg-zinc-800">
          {[
            "Heading 1",
            "Heading 2",
            "Heading 3",
            "Heading 4",
            "Heading 5",
            "Heading 6",
            "Paragraph",
          ].map((type) => (
            <SelectItem
              key={type}
              className="hover:!bg-zinc-600 focus:!bg-zinc-600 hover:!text-white focus:!text-white"
              value={type.toLowerCase().replace(" ", "-")}
            >
              {type === "Paragraph" ? (
                <p>{type}</p>
              ) : (
                React.createElement(`h${type.split(" ")[1]}`, {}, type)
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="w-full p-2 bg-black/40 rounded-xl gap-1 mb-5 flex flex-row items-center">
      <Button
        className={editor.isActive("bold") ? "bg-white/30" : ""}
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </Button>
      <Button
        className={`${
          editor.isActive("italic") ? "bg-white/30" : ""
        } !font-serif italic`}
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </Button>
      <Button
        className={`${
          editor.isActive("underline") ? "bg-white/30" : ""
        } !font-serif underline`}
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </Button>
      <TextTypeSelector />
      <Button
        className={editor.isActive("bulletList") ? "bg-white/30" : ""}
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </Button>
      <Button
        className={editor.isActive("orderedList") ? "bg-white/30" : ""}
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <DashIcon />
      </Button>
      <div className="flex items-center ml-auto mr-5">
        <Button
          disabled={!editor.can().undo()}
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 color={editor.can().undo() ? "white" : "grey"} />
        </Button>
        <Button
          disabled={!editor.can().redo()}
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 color={editor.can().redo() ? "white" : "grey"} />
        </Button>
      </div>
      <div
        className={`text-sm pr-3 ${
          editor?.storage?.characterCount?.characters() === 10_000
            ? "text-red-500"
            : "text-primary"
        }`}
      >
        {editor?.storage?.characterCount?.characters()} / 10000 characters
      </div>
    </div>
  );
};

// const TextTypeSelector = ({ editor }) => {
//   const currentTextType = editor.isActive("paragraph")
//     ? "Paragraph"
//     : editor.isActive("heading", { level: 1 })
//     ? "Heading 1"
//     : editor.isActive("heading", { level: 2 })
//     ? "Heading 2"
//     : editor.isActive("heading", { level: 3 })
//     ? "Heading 3"
//     : editor.isActive("heading", { level: 4 })
//     ? "Heading 4"
//     : editor.isActive("heading", { level: 5 })
//     ? "Heading 5"
//     : editor.isActive("heading", { level: 6 })
//     ? "Heading 6"
//     : "Paragraph"; // Default to Paragraph

//   const handleSelect = (value) => {
//     if (value === "paragraph") {
//       editor.chain().focus().setParagraph().run();
//     } else if (value === "heading-1") {
//       editor.chain().focus().toggleHeading({ level: 1 }).run();
//     } else if (value === "heading-2") {
//       editor.chain().focus().toggleHeading({ level: 2 }).run();
//     } else if (value === "heading-3") {
//       editor.chain().focus().toggleHeading({ level: 3 }).run();
//     } else if (value === "heading-4") {
//       editor.chain().focus().toggleHeading({ level: 4 }).run();
//     } else if (value === "heading-5") {
//       editor.chain().focus().toggleHeading({ level: 5 }).run();
//     } else if (value === "heading-6") {
//       editor.chain().focus().toggleHeading({ level: 6 }).run();
//     }
//   };

//   return (
//     <Select
//       onValueChange={handleSelect}
//       defaultValue={currentTextType.toLowerCase()}
//     >
//       <SelectTrigger className="outline-none border-none focus:!border-none w-fit space-x-3 hover:bg-black/30 focus:bg-black/30">
//         <SelectValue placeholder="Select Text Type" />
//       </SelectTrigger>
//       <SelectContent className="bg-zinc-900 border-none text-foreground-300 active:bg-zinc-800 ">
//         <SelectItem
//           value="heading-1"
//           className="hover:!bg-zinc-600 focus:!bg-zinc-600  hover:!text-white focus:!text-white"
//         >
//           <h1>Heading 1</h1>
//         </SelectItem>
//         <SelectItem
//           value="heading-2"
//           className="hover:!bg-zinc-600 focus:!bg-zinc-600  hover:!text-white focus:!text-white"
//         >
//           <h2>Heading 2</h2>
//         </SelectItem>
//         <SelectItem
//           value="heading-3"
//           className="hover:!bg-zinc-600 focus:!bg-zinc-600  hover:!text-white focus:!text-white"
//         >
//           <h3>Heading 3</h3>
//         </SelectItem>
//         <SelectItem
//           value="heading-4"
//           className="hover:!bg-zinc-600 focus:!bg-zinc-600  hover:!text-white focus:!text-white"
//         >
//           <h4>Heading 4</h4>
//         </SelectItem>
//         <SelectItem
//           value="heading-5"
//           className="hover:!bg-zinc-600 focus:!bg-zinc-600  hover:!text-white focus:!text-white"
//         >
//           <h5>Heading 5</h5>
//         </SelectItem>
//         <SelectItem
//           value="heading-6"
//           className="hover:!bg-zinc-600 focus:!bg-zinc-600  hover:!text-white focus:!text-white"
//         >
//           <h6>Heading 6</h6>
//         </SelectItem>
//         <SelectItem
//           value="paragraph"
//           className="hover:!bg-zinc-600 focus:!bg-zinc-600  hover:!text-white focus:!text-white"
//         >
//           <p>Paragraph</p>
//         </SelectItem>
//       </SelectContent>
//     </Select>
//   );
// };

// const limit = 10000;
