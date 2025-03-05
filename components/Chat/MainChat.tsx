"use client";

import debounce from "lodash.debounce";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import ChatRenderer from "@/components/Chat/ChatRenderer";
import MainSearchbar from "@/components/Chat/SearchBar/MainSearchbar";

const MainChat = React.memo(function MainChat() {
  const convoRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const { id } = useParams(); // This will be undefined for `/c` and set for `/c/:id`
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = debounce((event: React.UIEvent) => {
    const { scrollTop, scrollHeight, clientHeight } =
      event.target as HTMLElement;
    const threshold = 1;

    setIsAtBottom(scrollHeight - scrollTop <= clientHeight + threshold);
  }, 100);

  const scrollToBottom = () => {
    if (convoRef.current)
      convoRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    return () => {
      handleScroll.cancel();
    };
  }, [handleScroll]);

  useEffect(() => {
    scrollToBottom();
    if (inputRef?.current) inputRef?.current?.focus();
  }, [id]); // Re-run effect when `id` changes

  return (
    <React.Fragment>
      <div className="w-full flex justify-center overflow-y-scroll">
        <div
          ref={convoRef}
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
