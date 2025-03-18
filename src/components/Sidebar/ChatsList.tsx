import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@heroui/button";
import { isToday, isYesterday, subDays } from "date-fns";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatBubbleAddIcon } from "../Misc/icons";
import { ChatTab } from "./ChatTab";
import {
  useConversationList,
  useFetchConversations,
} from "@/hooks/useConversationList";
import { useConversation } from "@/hooks/useConversation";

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
  const router = useRouter();
  const { clearMessages } = useConversation();

  useEffect(() => {
    fetchConversations();
  }, []);

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
        root: null, // viewport as container
        threshold: 1.0,
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [currentPage, isFetchingMore, paginationMeta, fetchConversations]);

  // Group conversations by time frame.
  const groupedConversations = conversations.reduce((acc, conversation) => {
    const timeFrame = getTimeFrame(conversation.createdAt);

    if (!acc[timeFrame]) {
      acc[timeFrame] = [];
    }
    acc[timeFrame].push(conversation);

    return acc;
  }, {} as Record<string, any[]>);

  // Sort time frames by defined priority.
  const sortedTimeFrames = Object.entries(groupedConversations).sort(
    ([timeFrameA], [timeFrameB]) =>
      timeFramePriority(timeFrameA) - timeFramePriority(timeFrameB)
  );

  const starredConversations = conversations.filter(
    (conversation) => conversation.starred
  );

  const createNewChat = (): void => {
    router.push(`/c`);
    clearMessages();
  };

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center p-10">
          <Loader className="animate-spin text-[#00bbff]" />
        </div>
      ) : (
        <>
          <div className="mt- w-full">
            <Button
              className="w-full text-primary text-sm justify-start"
              color="primary"
              size="sm"
              variant="flat"
              onPress={createNewChat}
            >
              <ChatBubbleAddIcon color="#00bbff" width={18} />
              Create new chat
            </Button>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full p-0"
            defaultValue="item-1"
          >
            <AccordionItem
              value="item-1"
              className="bg-zinc-900 min-h-fit pb-1 mt-2 flex items-start justify-start rounded-lg flex-col overflow-hidden pt-0 border-b-0 w-full"
            >
              <AccordionTrigger className="text-xs px-3 pt-3 pb-2 w-[210px]">
                Starred Chats
              </AccordionTrigger>
              <AccordionContent className="!p-0 w-full">
                <div className="flex w-full flex-col -mr-4">
                  {starredConversations.length > 0 ? (
                    starredConversations.map(
                      (conversation: {
                        conversation_id: string;
                        description: string;
                        starred?: boolean;
                      }) => (
                        <ChatTab
                          key={conversation.conversation_id}
                          id={conversation.conversation_id}
                          name={conversation.description || "New Chat"}
                          starred={conversation.starred || false}
                        />
                      )
                    )
                  ) : (
                    <div className="text-xs text-center text-nowrap text-foreground-500 pt-2 pb-3 w-full">
                      No Starred Chats yet.
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* <div className="bg-zinc-900 min-h-fit pt-3 pb-1 mt-2 flex items-start justify-start rounded-lg flex-col overflow-hidden w-full">
              <div className="font-medium text-xs flex items-center gap-1 px-3 pb-1">
                Starred Chats
              </div>
            </div> */}

          {/* Grouped Conversations by Time Frame */}
          {sortedTimeFrames.map(([timeFrame, conversationsGroup]) => (
            <div key={timeFrame}>
              <div className="font-medium px-2 text-xs pt-3 text-foreground-500 pb-1 sticky top-0 bg-black z-[1]">
                {timeFrame}
              </div>
              {conversationsGroup
                .sort(
                  (a: { createdAt: string }, b: { createdAt: string }) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map(
                  (conversation: {
                    conversation_id: string;
                    starred: boolean;
                    description: string;
                  }) => (
                    <ChatTab
                      key={conversation.conversation_id}
                      id={conversation.conversation_id}
                      name={conversation.description || "New Chat"}
                      starred={conversation.starred}
                    />
                  )
                )}
            </div>
          ))}
        </>
      )}

      {/* Sentinel element for the IntersectionObserver */}
      <div
        ref={loadMoreRef}
        className="p-2 h-[250px] flex justify-center items-center"
      >
        {isFetchingMore && <Loader className="animate-spin text-[#00bbff]" />}
      </div>
    </>
  );
}
