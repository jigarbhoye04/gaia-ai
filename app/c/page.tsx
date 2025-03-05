import debounce from "lodash.debounce";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import ChatRenderer from "@/components/Chat/ChatRenderer";
import MainSearchbar from "@/components/Chat/SearchBar/MainSearchbar";

const MainChat = React.memo(function MainChat() {
  const convoRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const router = useRouter();
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
  }, [router.pathname]);

  return (
    <>
      {/* <ScrollArea onScrollCapture={handleScroll}> */}
      <div className="w-full flex justify-center overflow-y-scroll">
        <div
          ref={convoRef}
          className="conversation_history max-w-screen-md w-full"
        >
          <ChatRenderer />
        </div>
      </div>
      {/* </ScrollArea> */}
      <MainSearchbar
        inputRef={inputRef}
        isAtBottom={isAtBottom}
        isOverflowing={false}
        scrollToBottom={scrollToBottom}
      />
    </>
  );
});

export default MainChat;
