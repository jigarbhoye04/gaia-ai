import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import StarterText from "@/components/Chat/StarterText";
import { useConversation } from "@/hooks/useConversation";
import { useConversationList } from "@/hooks/useConversationList";
import { useLoading } from "@/hooks/useLoading";
import { MessageType } from "@/types/convoTypes";

import ChatBubbleBot from "./ChatBubbles/Bot/ChatBubbleBot";
import ChatBubbleUser from "./ChatBubbles/ChatBubbleUser";
import GeneratedImageSheet from "./GeneratedImageSheet";
import { Spinner } from "@heroui/spinner";

export default function ChatRenderer() {
  const { convoMessages } = useConversation();
  const { conversations } = useConversationList();
  const [openImage, setOpenImage] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const messageId = searchParams.get("messageId");
  const { isLoading } = useLoading();
  const { id: convoIdParam } = useParams<{ id: string }>();
  const scrolledToMessageRef = useRef<string | null>(null);

  const [imageData, setImageData] = useState({
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
      <div className="flex flex-1 items-start justify-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <Image
            alt="GAIA Logo"
            src={"/branding/logo.webp"}
            width={150}
            height={150}
            className="bobbing hover:translate-y-3"
          />
          <StarterText />
        </div>
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
        openImage={openImage}
        setOpenImage={setOpenImage}
      />

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
              filename={message.filename}
              imagePrompt={message.imagePrompt}
              imageSrc={message.imageUrl}
              improvedImagePrompt={message.improvedImagePrompt}
              intent={message.intent}
              isImage={message.isImage}
              loading={message.loading}
              message_id={message.message_id}
              pageFetchURL={message.pageFetchURL}
              pinned={message.pinned}
              searchWeb={message.searchWeb}
              setImageData={setImageData}
              setOpenImage={setOpenImage}
              text={message.response}
              disclaimer={message.disclaimer}
              // userinputType={message.userinputType}
              date={message.date}
              search_results={message.search_results}
            />
          </div>
        ) : (
          <ChatBubbleUser
            key={index}
            date={message.date}
            filename={message.filename}
            message_id={message.message_id}
            pageFetchURL={message.pageFetchURL}
            searchWeb={message.searchWeb}
            subtype={message.subtype || null}
            text={message.response}
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
          <div>GAIA is thinking</div>
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
