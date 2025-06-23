import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Spinner from "@/components/ui/shadcn/spinner";
import ChatBubbleBot from "@/features/chat/components/bubbles/bot/ChatBubbleBot";
import SearchedImageDialog from "@/features/chat/components/bubbles/bot/SearchedImageDialog";
import ChatBubbleUser from "@/features/chat/components/bubbles/user/ChatBubbleUser";
import GeneratedImageSheet from "@/features/chat/components/image/GeneratedImageSheet";
import StarterText from "@/features/chat/components/interface/StarterText";
import MemoryModal from "@/features/chat/components/memory/MemoryModal";
import { useConversation } from "@/features/chat/hooks/useConversation";
import { useConversationList } from "@/features/chat/hooks/useConversationList";
import { useLoading } from "@/features/chat/hooks/useLoading";
import { useLoadingText } from "@/features/chat/hooks/useLoadingText";
import { SetImageDataType } from "@/types/features/chatBubbleTypes";
import { MessageType } from "@/types/features/convoTypes";

export default function ChatRenderer() {
  const { convoMessages } = useConversation();
  const { conversations } = useConversationList();
  const [openGeneratedImage, setOpenGeneratedImage] = useState<boolean>(false);
  const [openMemoryModal, setOpenMemoryModal] = useState<boolean>(false);
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
            ?.description || "New chat"
        } | GAIA`}
      </title>

      <GeneratedImageSheet
        imageData={imageData}
        openImage={openGeneratedImage}
        setOpenImage={setOpenGeneratedImage}
      />

      <MemoryModal
        isOpen={openMemoryModal}
        onClose={() => setOpenMemoryModal(false)}
      />

      <SearchedImageDialog />

      {convoMessages?.map((message: MessageType, index: number) =>
        message.type === "bot" ? (
          <div
            key={index}
            className="relative flex items-end gap-1 pt-1 pb-5 pl-1"
          >
            <div className="min-w-[40px]">
              <Image
                alt="GAIA Logo"
                src={"/branding/logo.webp"}
                width={30}
                height={30}
                className={`${isLoading ? "opacity-0" : "opacity-100"} relative transition duration-150`}
              />
            </div>

            <ChatBubbleBot
              calendar_options={message.calendar_options}
              calendar_delete_options={message.calendar_delete_options}
              calendar_edit_options={message.calendar_edit_options}
              email_compose_data={message.email_compose_data}
              intent={message.intent}
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
              image_data={message.image_data}
              memory_data={message.memory_data}
              todo_data={message.todo_data}
              document_data={message.document_data}
              code_data={message.code_data}
              onOpenMemoryModal={() => setOpenMemoryModal(true)}
              google_docs_data={message.google_docs_data}
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
        <div className="flex items-center gap-4 pt-3 pl-[40px] text-sm font-medium">
          {/* <Image
            alt="GAIA Logo"
            src={"/branding/logo.webp"}
            width={30}
            height={30}
            className={`animate-spin`}
          /> */}
          <span>{loadingText || "GAIA is thinking..."}</span>
          <Spinner />
        </div>
      )}
    </>
  );
}
