"use client";

import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";

interface NotesHeaderProps {
  onDeleteNote?: () => void;
}

export default function NotesHeader({ onDeleteNote }: NotesHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between dark">
      <Link href="/notes">
        <Button
          className="w-fit gap-1 px-0 font-normal text-white"
          variant={"link"}
        >
          <ChevronLeft width={17} />
          All Notes
        </Button>
      </Link>

      {onDeleteNote && (
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
            className="border-none bg-zinc-800 p-0 hover:bg-zinc-900!"
          >
            <DropdownMenuItem
              className="cursor-pointer p-3 text-red-500 hover:bg-zinc-900! hover:text-red-500!"
              onClick={onDeleteNote}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
