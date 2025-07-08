"use client";

import { isToday, isYesterday, subDays } from "date-fns";
import { Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/shadcn/accordion";
import { Conversation } from "@/features/chat/api/chatApi";
import {
  useConversationList,
  useFetchConversations,
} from "@/features/chat/hooks/useConversationList";

import { ChatTab } from "./ChatTab";

const getTimeFrame = (dateString: string): string => {
  const date = new Date(dateString);

  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  const daysAgo7 = subDays(new Date(), 7);
  const daysAgo30 = subDays(new Date(), 30);

  if (date >= daysAgo7) return "Previous 7 days";
  if (date >= daysAgo30) return "Previous 30 days";

  return "All time";
};

const timeFramePriority = (timeFrame: string): number => {
  switch (timeFrame) {
    case "Today":
      return 0;
    case "Yesterday":
      return 1;
    case "Previous 7 days":
      return 2;
    case "Previous 30 days":
      return 3;
    case "All time":
      return 4;
    default:
      return 5;
  }
};

export default function ChatsList() {
  const { conversations, paginationMeta } = useConversationList();
  const fetchConversations = useFetchConversations();
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // We assume the provider auto-fetches the first page.
  // Once paginationMeta is available, we consider the initial load complete.
  useEffect(() => {
    if (paginationMeta) setLoading(false);
  }, [paginationMeta]);

  // Set up an IntersectionObserver to load more pages.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          entry.isIntersecting &&
          !isFetchingMore &&
          paginationMeta &&
          currentPage < paginationMeta.total_pages
        ) {
          setIsFetchingMore(true);
          // Always use a fixed limit (e.g. 10) and always append new results.
          fetchConversations(currentPage + 1, 20, true)
            .then(() => {
              setCurrentPage((prevPage) => prevPage + 1);
            })
            .catch((error) => {
              console.error("Failed to fetch more conversations", error);
            })
            .finally(() => {
              setIsFetchingMore(false);
            });
        }
      },
      {
        root: null,
        threshold: 1.0,
      },
    );

    const currentLoadMoreRef = loadMoreRef.current;

    if (currentLoadMoreRef) observer.observe(currentLoadMoreRef);

    return () => {
      if (currentLoadMoreRef) observer.unobserve(currentLoadMoreRef);
    };
  }, [currentPage, isFetchingMore, paginationMeta, fetchConversations]);

  // Group conversations by time frame.
  const groupedConversations = conversations.reduce(
    (acc, conversation) => {
      const timeFrame = getTimeFrame(conversation.createdAt);

      if (!acc[timeFrame]) {
        acc[timeFrame] = [];
      }
      acc[timeFrame].push(conversation);

      return acc;
    },
    {} as Record<string, Conversation[]>,
  );

  // Sort time frames by defined priority.
  const sortedTimeFrames = Object.entries(groupedConversations).sort(
    ([timeFrameA], [timeFrameB]) =>
      timeFramePriority(timeFrameA) - timeFramePriority(timeFrameB),
  );

  const starredConversations = conversations.filter(
    (conversation) => conversation.starred,
  );

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center p-10">
          <Loader className="animate-spin text-[#00bbff]" />
        </div>
      ) : (
        <>
          {starredConversations.length > 0 && (
            <Accordion
              type="single"
              collapsible
              className="w-full p-0"
              defaultValue="item-1"
            >
              <AccordionItem
                value="item-1"
                className="my-1 flex min-h-fit w-full flex-col items-start justify-start overflow-hidden rounded-lg border-b-0 bg-zinc-900 px-1 py-2"
              >
                <AccordionTrigger className="w-full px-2 pt-0 pb-1 text-xs">
                  Starred Chats
                </AccordionTrigger>
                <AccordionContent className="w-full p-0!">
                  <div className="-mr-4 flex w-full flex-col">
                    {starredConversations.map((conversation: Conversation) => (
                      <ChatTab
                        key={conversation.conversation_id}
                        id={conversation.conversation_id}
                        name={conversation.description || "New chat"}
                        starred={conversation.starred || false}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Grouped Conversations by Time Frame */}
          {sortedTimeFrames.map(([timeFrame, conversationsGroup]) => (
            <div key={timeFrame}>
              <div className="sticky top-0 z-1 bg-zinc-950 px-2 py-1 text-xs text-foreground-500">
                {timeFrame}
              </div>
              {conversationsGroup
                .sort(
                  (a: Conversation, b: Conversation) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((conversation: Conversation, index: number) => (
                  <ChatTab
                    key={index}
                    id={conversation.conversation_id}
                    name={conversation.description || "New chat"}
                    starred={conversation.starred}
                  />
                ))}
            </div>
          ))}
        </>
      )}

      {/* Sentinel element for the IntersectionObserver */}
      <div
        ref={loadMoreRef}
        className="flex h-[250px] items-center justify-center p-2"
      >
        {isFetchingMore && <Loader className="animate-spin text-[#00bbff]" />}
      </div>
    </>
  );
}
