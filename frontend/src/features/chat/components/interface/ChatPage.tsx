"use client";

import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import Composer from "@/features/chat/components/composer/Composer";
import { FileDropModal } from "@/features/chat/components/files/FileDropModal";
import ChatRenderer from "@/features/chat/components/interface/ChatRenderer";
import { useConversation } from "@/features/chat/hooks/useConversation";
import { fetchMessages } from "@/features/chat/utils/chatUtils";
import { useDragAndDrop } from "@/hooks/ui/useDragAndDrop";

const ChatPage = React.memo(function MainChat() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { updateConvoMessages } = useConversation();
  const { id: convoIdParam } = useParams<{ id: string }>();
  const messageId = searchParams.get("messageId");

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  // const [isAtBottom, setIsAtBottom] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const fileUploadRef = useRef<{
    openFileUploadModal: () => void;
    handleDroppedFiles: (files: File[]) => void;
  } | null>(null);

  // const handleScroll = debounce((event: React.UIEvent, threshold = 1) => {
  //   const { scrollTop, scrollHeight, clientHeight } =
  //     event.target as HTMLElement;
  //   setIsAtBottom(scrollHeight - scrollTop <= clientHeight + threshold);
  // }, 100);

  const scrollToBottom = () => {
    // If a specific message is being viewed, do not scroll to bottom, scroll to that message instead.
    // This is to prevent the chat from scrolling to the bottom when a user is redirected to a specific message.
    // Scrolling to message is handled in ChatRenderer.
    if (messageId) return;
    if (chatRef.current)
      chatRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  // Drag and drop functionality
  const { isDragging, dragHandlers } = useDragAndDrop({
    onDrop: (files: File[]) => {
      setDroppedFiles(files);
      if (fileUploadRef.current) {
        fileUploadRef.current.handleDroppedFiles(files);
        fileUploadRef.current.openFileUploadModal();
      }
    },
    multiple: true,
  });

  // ! THIS DOESNT CAUSE AN INFINITE LOOP
  useEffect(() => {
    if (convoIdParam) {
      fetchMessages(convoIdParam, updateConvoMessages, router).then(() => {
        setTimeout(scrollToBottom, 500);
      });
    } else if (pathname !== "/c") router.push("/c");

    if (inputRef?.current) inputRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convoIdParam]);

  // ! THIS CAUSES AN INFINITE LOOP
  // const fetchConvoMessages = useCallback(async () => {
  //   if (convoIdParam) {
  //     await fetchMessages(convoIdParam, updateConvoMessages, router);
  //     setTimeout(scrollToBottom, 500);
  //   } else if (pathname !== "/c") {
  //     router.push("/c");
  //   }

  //   if (inputRef?.current) inputRef.current.focus();
  // }, [convoIdParam, updateConvoMessages, router, pathname]);

  // useEffect(() => {
  //   fetchConvoMessages();
  // }, [fetchConvoMessages]);

  // useEffect(() => {
  //   return () => {
  //     handleScroll.cancel();
  //   };
  // }, [handleScroll]);

  return (
    <div className="flex h-full flex-col">
      <div
        className={`relative flex w-full flex-1 justify-center overflow-y-auto ${isDragging ? "bg-zinc-800/30" : ""}`}
        {...dragHandlers}
      >
        <FileDropModal isDragging={isDragging} />

        <div
          ref={chatRef}
          className="conversation_history w-full max-w-(--breakpoint-lg) p-2 sm:p-4"
        >
          <ChatRenderer />
        </div>
      </div>
      <div className="flex-shrink-0 pb-2">
        <Composer
          inputRef={inputRef}
          scrollToBottom={scrollToBottom}
          fileUploadRef={fileUploadRef}
          droppedFiles={droppedFiles}
          onDroppedFilesProcessed={() => setDroppedFiles([])}
        />
      </div>
    </div>
  );
});

export default ChatPage;
