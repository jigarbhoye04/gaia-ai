import { DashIcon } from "@radix-ui/react-icons";
import { Editor } from "@tiptap/react";
import {
  ALargeSmall,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo2,
  Undo2,
  Unlink,
} from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/shadcn/select";

export const MenuBar = ({
  editor,
  isEmail = false,
  textLength = true,
}: {
  editor: Editor | null;
  isEmail?: boolean;
  textLength?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  if (!editor) {
    return null;
  }

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setOpen(true);
  };

  const applyLink = () => {
    if (linkUrl.trim() === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl, target: "_blank" }).run();
    }
    setOpen(false);
  };

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
        const level = Number.parseInt(value.split("-")[1]) as
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6;
        editor.chain().focus().toggleHeading({ level }).run();
      }
    };

    return (
      <Select
        defaultValue={currentTextType.toLowerCase().replace(" ", "-")}
        onValueChange={handleSelect}
      >
        <SelectTrigger className="w-fit space-x-3 border-none outline-hidden hover:bg-black/30 focus:border-none! focus:bg-black/30">
          <ALargeSmall />
        </SelectTrigger>
        <SelectContent className="border-none bg-zinc-900 text-foreground-300 active:bg-zinc-800">
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
              className="bg-zinc-900 transition-all hover:bg-zinc-800! hover:text-white! focus:bg-zinc-800! focus:text-white!"
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
    <div
      className={`w-full gap-1 bg-black/40 ${
        isEmail ? "mb-0 rounded-none p-0" : "mb-5 rounded-xl p-2"
      } flex flex-row items-center dark`}
    >
      <Button
        className={editor.isActive("bold") ? "bg-white/20" : ""}
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </Button>
      <Button
        className={`${
          editor.isActive("italic") ? "bg-white/20" : ""
        } !font-serif italic`}
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </Button>
      <Button
        className={`${
          editor.isActive("underline") ? "bg-white/20" : ""
        } !font-serif underline`}
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </Button>
      <TextTypeSelector />
      <Button
        className={editor.isActive("bulletList") ? "bg-white/20" : ""}
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </Button>
      <Button
        className={editor.isActive("orderedList") ? "bg-white/20" : ""}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={editor.isActive("link") ? "bg-white/20" : ""}
            onClick={handleSetLink}
          >
            <LinkIcon />
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-lg bg-zinc-900 p-4">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL"
            className="mb-3 rounded-md bg-zinc-800 p-2 text-white"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={applyLink}>
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
      >
        <Unlink />
      </Button>

      <div className="mr-5 ml-auto flex items-center">
        <Button
          disabled={!editor.can().undo()}
          size="icon"
          variant="ghost"
          className={editor.can().undo() ? "text-grey" : "text-white"}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 />
        </Button>
        <Button
          disabled={!editor.can().redo()}
          size="icon"
          className={editor.can().undo() ? "text-grey" : "text-white"}
          variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 />
        </Button>
      </div>

      {textLength && (
        <div
          className={`pr-3 text-sm ${
            editor?.storage?.characterCount?.characters() === 10_000
              ? "text-red-500"
              : "text-primary"
          }`}
        >
          {editor?.storage?.characterCount?.characters()} / 10000 characters
        </div>
      )}
    </div>
  );
};
