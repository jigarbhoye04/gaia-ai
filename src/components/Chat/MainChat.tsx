"use client";

import debounce from "lodash.debounce";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import ChatRenderer from "@/components/Chat/ChatRenderer";
import MainSearchbar from "@/components/Chat/SearchBar/MainSearchbar";
import { useConversation } from "@/hooks/useConversation";
import { fetchMessages } from "@/utils/chatUtils";

const MainChat = React.memo(function MainChat() {
  const router = useRouter();
  const pathname = usePathname();
  const { updateConvoMessages } = useConversation();
  const { id: convoIdParam } = useParams<{ id: string }>(); // This will be undefined for `/c` and set for `/c/:id`
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleScroll = debounce((event: React.UIEvent, threshold = 1) => {
    const { scrollTop, scrollHeight, clientHeight } =
      event.target as HTMLElement;
    setIsAtBottom(scrollHeight - scrollTop <= clientHeight + threshold);
  }, 100);

  const scrollToBottom = () => {
    if (chatRef.current)
      chatRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const fetchAndScroll = React.useCallback(async () => {
    await fetchMessages(convoIdParam, updateConvoMessages, router);
    setTimeout(scrollToBottom, 500);
  }, [convoIdParam, updateConvoMessages, router]);

  useEffect(() => {
    if (convoIdParam) fetchAndScroll();
    else if (pathname !== "/c") router.push("/c");
    if (inputRef?.current) inputRef?.current?.focus();
  }, [convoIdParam, pathname, router, fetchAndScroll]);

  useEffect(() => {
    fetchAndScroll();
  }, [fetchAndScroll]);

  useEffect(() => {
    return () => {
      handleScroll.cancel();
    };
  }, [handleScroll]);

  return (
    <React.Fragment>
      <div className="flex w-full justify-center overflow-y-auto">
        <div
          ref={chatRef}
          className="conversation_history w-full max-w-screen-md"
        >
          <ChatRenderer />
        </div>
      </div>
      <MainSearchbar
        inputRef={inputRef}
        isAtBottom={isAtBottom}
        isOverflowing={false}
        scrollToBottom={scrollToBottom}
      />
    </React.Fragment>
  );
});

export default MainChat;
