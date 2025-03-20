import { Chip } from "@heroui/chip";
import { ArrowUpRight, GlobeIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { parseDate2 } from "@/utils/fetchDate";

import {
  BubbleChatIcon,
  BubbleConversationChatIcon,
  StickyNote01Icon,
} from "../Misc/icons";
import { CommandItem } from "../ui/command";

interface SearchMessageResult {
  conversation_id: string;
  message: {
    message_id: string;
    type: "bot" | "user";
    date: string;
    searchWeb?: boolean;
    pageFetchURL?: string;
  };
  snippet: string;
}

interface SearchConversationResult {
  conversation_id: string;
  description: string;
}

interface SearchNoteResult {
  id: string;
  snippet: string;
}

type SearchResultType =
  | SearchMessageResult
  | SearchConversationResult
  | SearchNoteResult;

interface SearchCardConfig<T extends SearchResultType> {
  icon: React.ReactNode;
  linkTo: (result: T) => string;
  bodyContent: (result: T) => React.ReactNode;
  footerContent?: (result: T) => React.ReactNode;
}

interface SearchCardProps {
  result: SearchResultType;
  type: "message" | "conversation" | "note";
  config?: SearchCardConfig<SearchResultType>;
  className?: string;
}

const defaultConfigs: Record<
  "message" | "conversation" | "note",
  SearchCardConfig<
    SearchMessageResult | SearchConversationResult | SearchNoteResult
  >
> = {
  message: {
    icon: (
      <BubbleChatIcon className="min-h-[22px] min-w-[22px]" color="#9b9b9b" />
    ),
    linkTo: (result: SearchMessageResult) => `/c/${result.conversation_id}`,
    bodyContent: (result: SearchMessageResult) => (
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
    footerContent: (result: SearchMessageResult) =>
      parseDate2(result.message.date),
  },
  conversation: {
    icon: (
      <BubbleConversationChatIcon
        className="min-h-[22px] min-w-[22px]"
        color="#9b9b9b"
      />
    ),
    linkTo: (result: SearchConversationResult) =>
      `/c/${result.conversation_id}`,
    bodyContent: (result: SearchConversationResult) => (
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
    linkTo: (result: SearchNoteResult) => `/notes/${result.id}`,
    bodyContent: (result: SearchNoteResult) => (
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

  return (result as SearchNoteResult).snippet ||
    (result as SearchConversationResult).description ? (
    <Link
      key={
        "message" in result && result.message?.message_id
          ? result.message.message_id
          : "conversation_id" in result
            ? result.conversation_id
            : result.id
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
