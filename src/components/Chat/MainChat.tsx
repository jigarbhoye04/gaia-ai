"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

import ChatRenderer from "@/components/Chat/ChatRenderer";
import MainSearchbar from "@/components/Chat/SearchBar/MainSearchbar";
import { useConversation } from "@/hooks/useConversation";
import { fetchMessages } from "@/utils/chatUtils";

import { FileDropModal } from "./Files/FileDropModal";

const MainChat = React.memo(function MainChat() {
  const router = useRouter();
  const pathname = usePathname();
  const { updateConvoMessages } = useConversation();
  const { id: convoIdParam } = useParams<{ id: string }>();
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  // const [isAtBottom, setIsAtBottom] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
    if (chatRef.current)
      chatRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the main container
    // rather than entering a child element
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setDroppedFiles(files);

      if (fileUploadRef.current) {
        fileUploadRef.current.handleDroppedFiles(files);
        fileUploadRef.current.openFileUploadModal();
      }
    }
  }, []);

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
    <>
      <div
        className={`relative flex h-full w-full justify-center overflow-y-auto ${isDragging ? "bg-zinc-800/30" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FileDropModal isDragging={isDragging} />

        <div
          ref={chatRef}
          className="conversation_history w-full max-w-(--breakpoint-md)"
        >
          <ChatRenderer />
        </div>
      </div>
      <MainSearchbar
        inputRef={inputRef}
        scrollToBottom={scrollToBottom}
        fileUploadRef={fileUploadRef}
        droppedFiles={droppedFiles}
        onDroppedFilesProcessed={() => setDroppedFiles([])}
      />
    </>
  );
});

export default MainChat;
