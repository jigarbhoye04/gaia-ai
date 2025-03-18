import { Chip } from "@heroui/chip";
import { ArrowUpRight,GlobeIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { parseDate2 } from "@/utils/fetchDate";

import {
  BubbleChatIcon,
  BubbleConversationChatIcon,
  StickyNote01Icon,
} from "../Misc/icons";
import { CommandItem } from "../ui/command";

interface SearchCardProps {
  result: any;
  type: "message" | "conversation" | "note";
  config?: {
    icon: React.ReactNode;
    linkTo: (result: any) => string;
    bodyContent: (result: any) => React.ReactNode;
    footerContent?: (result: any) => React.ReactNode;
  };
  className?: string;
}

const defaultConfigs = {
  message: {
    icon: (
      <BubbleChatIcon className="min-h-[22px] min-w-[22px]" color="#9b9b9b" />
    ),
    linkTo: (result: any) => `/c/${result.conversation_id}`,
    bodyContent: (result: any) => (
      <>
        <div className="flex items-center gap-2">
          <Chip
            color={result.message.type === "bot" ? "primary" : "default"}
            size="sm"
          >
            {result.message.type === "bot" ? "From GAIA" : "From You"}
          </Chip>

          {result.message.searchWeb && (
            <Chip
              color="primary"
              size="sm"
              startContent={<GlobeIcon color="#00bbff" height={20} />}
              variant="flat"
            >
              Live Search Results from the Web
            </Chip>
          )}

          {!!result.message.pageFetchURL && (
            <Chip
              color="primary"
              size="sm"
              startContent={<ArrowUpRight color="#00bbff" height={20} />}
              variant="flat"
            >
              Fetched Webpage
            </Chip>
          )}
        </div>
        <CommandItem className="w-full cursor-pointer truncate !px-0 !py-1 data-[selected='true']:!bg-transparent">
          {result.snippet}
        </CommandItem>
      </>
    ),
    footerContent: (result: any) => parseDate2(result.message.date),
  },
  conversation: {
    icon: (
      <BubbleConversationChatIcon
        className="min-h-[22px] min-w-[22px]"
        color="#9b9b9b"
      />
    ),
    linkTo: (result: any) => `/c/${result.conversation_id}`,
    bodyContent: (result: any) => (
      <CommandItem className="w-full cursor-pointer truncate !px-0 !py-1 data-[selected='true']:!bg-transparent">
        {result.description}
      </CommandItem>
    ),
    footerContent: undefined,
  },
  note: {
    icon: (
      <StickyNote01Icon className="min-h-[22px] min-w-[22px]" color="#9b9b9b" />
    ),
    linkTo: (result: any) => `/notes/${result.id}`,
    bodyContent: (result: any) => (
      <CommandItem className="w-full cursor-pointer truncate !px-0 !py-1 data-[selected='true']:!bg-transparent">
        {result.snippet}
      </CommandItem>
    ),
    footerContent: undefined,
  },
};

export function SearchCard({
  result,
  type,
  config,
  className,
}: SearchCardProps) {
  const { icon, linkTo, bodyContent, footerContent } =
    config || defaultConfigs[type];

  return result.snippet || result.description || result.snippet ? (
    <Link
      key={
        type === "message" ? result.message.message_id : result.conversation_id
      }
      className={`my-2 flex h-full flex-row items-center gap-2 overflow-hidden rounded-xl bg-zinc-800 p-2 px-3 transition-colors hover:bg-zinc-700 ${className}`}
      href={linkTo(result)}
    >
      <div className="min-h-[22px] min-w-[22px]">{icon}</div>
      <div className="flex-1">{bodyContent(result)}</div>
      {footerContent && (
        <div className="ml-auto text-sm text-foreground-500">
          {footerContent(result)}
        </div>
      )}
    </Link>
  ) : null;
}
