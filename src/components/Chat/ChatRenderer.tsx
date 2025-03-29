import { Spinner } from "@heroui/spinner";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import StarterText from "@/components/Chat/StarterText";
import { useConversation } from "@/hooks/useConversation";
import { useConversationList } from "@/hooks/useConversationList";
import { useLoading } from "@/hooks/useLoading";
import { useLoadingText } from "@/hooks/useLoadingText";
import { SetImageDataType } from "@/types/chatBubbleTypes";
import { MessageType } from "@/types/convoTypes";

import ChatBubbleBot from "./ChatBubbles/Bot/ChatBubbleBot";
import SearchedImageDialog from "./ChatBubbles/Bot/SearchResults/SearchedImageDialog";
import ChatBubbleUser from "./ChatBubbles/User/ChatBubbleUser";
import GeneratedImageSheet from "./Image/GeneratedImageSheet";

export default function ChatRenderer() {
  const { convoMessages } = useConversation();
  const { conversations } = useConversationList();
  const [openGeneratedImage, setOpenGeneratedImage] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const messageId = searchParams.get("messageId");
  const { isLoading } = useLoading();
  const { loadingText } = useLoadingText();
  const { id: convoIdParam } = useParams<{ id: string }>();
  const scrolledToMessageRef = useRef<string | null>(null);
  const [imageData, setImageData] = useState<SetImageDataType>({
    src: "",
    prompt: "",
    improvedPrompt: "",
  });

  useEffect(() => {
    if (
      messageId &&
      convoMessages.length > 0 &&
      scrolledToMessageRef.current !== messageId
    ) {
      scrollToMessage(messageId);
      scrolledToMessageRef.current = messageId;
    }
  }, [messageId, convoMessages]);

  const scrollToMessage = (messageId: string) => {
    if (!messageId) return;

    const messageElement = document.getElementById(messageId);

    if (!messageElement) return;

    messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    messageElement.style.transition = "all 0.3s ease";

    setTimeout(() => {
      messageElement.style.scale = "1.07";

      setTimeout(() => {
        messageElement.style.scale = "1";
      }, 300);
    }, 300);
  };

  if (!!convoMessages && convoMessages?.length === 0) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center gap-2">
        <Image
          alt="GAIA Logo"
          src={"/branding/logo.webp"}
          width={130}
          height={130}
          className="bobbing hover:translate-y-3"
        />
        <StarterText />
      </div>
    );
  }

  return (
    <>
      <title id="chat_title">
        {`${
          conversations.find((convo) => convo.conversation_id === convoIdParam)
            ?.description || "New Chat"
        } | GAIA`}
      </title>

      <GeneratedImageSheet
        imageData={imageData}
        openImage={openGeneratedImage}
        setOpenImage={setOpenGeneratedImage}
      />

      <SearchedImageDialog />

      {convoMessages?.map((message: MessageType, index: number) =>
        message.type === "bot" ? (
          <div key={index} className="relative flex items-end gap-2">
            <Image
              alt="GAIA Logo"
              src={"/branding/logo.webp"}
              width={30}
              height={30}
              className={`${isLoading ? "animate-spin" : ""} relative bottom-14`}
            />

            <ChatBubbleBot
              calendar_options={message.calendar_options}
              imagePrompt={message.imagePrompt}
              imageSrc={message.imageUrl}
              improvedImagePrompt={message.improvedImagePrompt}
              intent={message.intent}
              isImage={message.isImage}
              loading={message.loading}
              message_id={message.message_id}
              pageFetchURLs={message.pageFetchURLs}
              pinned={message.pinned}
              searchWeb={message.searchWeb}
              setImageData={setImageData}
              setOpenImage={setOpenGeneratedImage}
              text={message.response}
              disclaimer={message.disclaimer}
              date={message.date}
              search_results={message.search_results}
              deep_search_results={message.deep_search_results}
              weather_data={message.weather_data}
            />
          </div>
        ) : (
          <ChatBubbleUser
            key={index}
            date={message.date}
            message_id={message.message_id}
            pageFetchURLs={message.pageFetchURLs}
            searchWeb={message.searchWeb}
            text={message.response}
            fileData={message.fileData}
          />
        ),
      )}
      {isLoading && (
        <div className="flex items-center gap-4 text-sm font-medium">
          <Image
            alt="GAIA Logo"
            src={"/branding/logo.webp"}
            width={30}
            height={30}
            className={`animate-spin`}
          />
          <div>{loadingText}</div>
          <Spinner
            variant="dots"
            color="primary"
            className="relative bottom-1"
          />
        </div>
      )}
    </>
  );
}
