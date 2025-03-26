// ChatBubbleBot.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatBubbleBotProps } from "@/types/chatBubbleTypes";
import { parseDate } from "@/utils/fetchDate";

import ChatBubble_Actions from "../Actions/ChatBubble_Actions";
import ChatBubble_Actions_Image from "../Actions/ChatBubble_Actions_Image";
import ImageBubble from "./ImageBubble";
import TextBubble from "./TextBubble";

export default function ChatBubbleBot(props: ChatBubbleBotProps) {
  const {
    text,
    loading = false,
    isImage = false,
    imageSrc = null,
    imagePrompt,
    message_id,
    pinned,
    date,
  } = props;

  // Memoized actions container to avoid unnecessary re-renders
  const actionsRef = useRef<HTMLDivElement>(null);

  const handleMouseOver = useCallback(() => {
    if (actionsRef.current) {
      actionsRef.current.style.opacity = "1";
      actionsRef.current.style.visibility = "visible";
    }
  }, []);

  const handleMouseOut = useCallback(() => {
    if (actionsRef.current) {
      actionsRef.current.style.opacity = "0";
      actionsRef.current.style.visibility = "hidden";
    }
  }, []);

  const renderedComponent = useMemo(() => {
    if (isImage) return <ImageBubble {...props} />;

    return <TextBubble {...props} />;
  }, [isImage, props]);

  return (
    (!!text || loading || isImage) && (
      <div
        id={message_id}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <div className="chatbubblebot_parent">
          <div className="chat_bubble_container">{renderedComponent}</div>
        </div>

        {!loading && (
          <div
            ref={actionsRef}
            className="flex flex-col gap-2 transition-all"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            {date && (
              <span className="flex select-text flex-col p-1 text-xs text-white text-opacity-40">
                {parseDate(date)}
              </span>
            )}

            {isImage ? (
              <ChatBubble_Actions_Image
                imagePrompt={imagePrompt}
                src={imageSrc as string}
              />
            ) : (
              <ChatBubble_Actions
                loading={loading}
                message_id={message_id}
                pinned={pinned}
                text={text}
              />
            )}
          </div>
        )}
      </div>
    )
  );
}
