import { Chip } from "@heroui/chip";
import Link from "next/link";
import { GlobeIcon, ArrowUpRight } from "lucide-react";
import React from "react";

import { CommandItem } from "../ui/command";
import {
  BubbleChatIcon,
  BubbleConversationChatIcon,
  StickyNote01Icon,
} from "../Misc/icons";

import { parseDate2 } from "@/utils/fetchDate";

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
        <CommandItem className="truncate w-full cursor-pointer data-[selected='true']:!bg-transparent !py-1 !px-0">
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
      <CommandItem className="truncate w-full cursor-pointer data-[selected='true']:!bg-transparent !py-1 !px-0">
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
      <CommandItem className="truncate w-full cursor-pointer data-[selected='true']:!bg-transparent !py-1 !px-0">
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
      className={`bg-zinc-800 p-2 px-3 rounded-xl h-full overflow-hidden flex flex-row hover:bg-zinc-700 transition-colors my-2 items-center gap-2 ${className}`}
      href={linkTo(result)}
    >
      <div className="min-h-[22px] min-w-[22px]">{icon}</div>
      <div className="flex-1">{bodyContent(result)}</div>
      {footerContent && (
        <div className="text-sm text-foreground-500 ml-auto">
          {footerContent(result)}
        </div>
      )}
    </Link>
  ) : null;
}

// Example usage in a parent component
// <SearchCard result={result} type="message" />
// <SearchCard result={result} type="conversation" />
