"use client";

import ChatRenderer from "@/components/Chat/ChatRenderer";
import MainSearchbar from "@/components/Chat/SearchBar/MainSearchbar";
import { useConvo } from "@/contexts/CurrentConvoMessages";
import { fetchMessages } from "@/utils/chatUtils";
import debounce from "lodash.debounce";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const MainChat = React.memo(function MainChat() {
  const router = useRouter();
  const { setConvoMessages } = useConvo();
  const { id: convoIdParam } = useParams<{ id: string }>(); // This will be undefined for `/c` and set for `/c/:id`
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    if (convoIdParam) fetchMessages(convoIdParam, setConvoMessages, router);
    else router.push("/c");
    scrollToBottom();
    if (inputRef?.current) inputRef?.current?.focus();
  }, [convoIdParam]);

  useEffect(() => {
    return () => {
      handleScroll.cancel();
    };
  }, [handleScroll]);

  return (
    <React.Fragment>
      <div className="w-full flex justify-center overflow-y-scroll">
        <div
          ref={chatRef}
          className="conversation_history max-w-screen-md w-full"
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
