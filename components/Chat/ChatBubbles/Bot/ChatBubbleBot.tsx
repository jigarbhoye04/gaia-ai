// ChatBubbleBot.tsx
import { ChatBubbleBotProps } from "@/types/chatBubbleTypes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    filename,
    message_id,
    pinned,
  } = props;

  const [fileScanningText, setFileScanningText] = useState(
    "Uploading Document..."
  );

  // Update file scanning text while the document is processing
  useEffect(() => {
    if (loading && !!filename) {
      const updateFileScanningText = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        setFileScanningText("Processing File...Please Wait");

        await new Promise((resolve) => setTimeout(resolve, 2500));
        setFileScanningText("Document analysis in progress...");

        await new Promise((resolve) => setTimeout(resolve, 2500));
        setFileScanningText("Converting file format...");

        await new Promise((resolve) => setTimeout(resolve, 3000));
        setFileScanningText("Extracting text from document...");

        await new Promise((resolve) => setTimeout(resolve, 4000));
        setFileScanningText("Analyzing document content...");

        await new Promise((resolve) => setTimeout(resolve, 5000));
        setFileScanningText("Processing document... Please wait...");

        await new Promise((resolve) => setTimeout(resolve, 5000));
        setFileScanningText("Document upload complete, processing metadata...");
      };

      updateFileScanningText();
    }
  }, [filename, loading]);

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

  // Memoize rendered component based on isImage prop
  const renderedComponent = useMemo(() => {
    if (isImage) {
      return <ImageBubble {...props} />;
    }
    return <TextBubble {...props} fileScanningText={fileScanningText} />;
  }, [isImage, fileScanningText, props]);

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
            className="transition-all"
            style={{ opacity: 0, visibility: "hidden" }}
          >
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
