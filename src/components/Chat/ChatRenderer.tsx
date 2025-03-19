import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import StarterText from "@/components/Chat/StarterText";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useConversation } from "@/hooks/useConversation";
import { useConversationList } from "@/hooks/useConversationList";
import { useLoading } from "@/hooks/useLoading";
import { MessageType } from "@/types/convoTypes";

import { ScrollArea } from "../ui/scroll-area";
import ChatBubble_Actions_Image from "./ChatBubbles/Actions/ChatBubble_Actions_Image";
import ChatBubbleBot from "./ChatBubbles/Bot/ChatBubbleBot";
import ChatBubbleUser from "./ChatBubbles/ChatBubbleUser";
import { Spinner } from "@heroui/spinner";

export default function ChatRenderer() {
  const { convoMessages } = useConversation();
  const { conversations } = useConversationList();
  const [openImage, setOpenImage] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const messageId = searchParams.get("messageId");
  const { isLoading } = useLoading();
  const { id: convoIdParam } = useParams<{ id: string }>();

  const [imageData, setImageData] = useState({
    src: "",
    prompt: "",
    improvedPrompt: "",
  });

  useEffect(() => {
    if (messageId && convoMessages.length > 0) scrollToMessage(messageId);
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
            src={"/branding/logo.png"}
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

      <Dialog open={openImage} onOpenChange={setOpenImage}>
        <DialogContent className="flex min-w-fit flex-col items-center !rounded-3xl border-none bg-zinc-800 px-5 py-3 text-white">
          <img
            alt={"Generated Image"}
            className="my-2 aspect-square size-[65vh] min-h-[65vh] min-w-[65vh] rounded-3xl"
            height={"auto"}
            src={imageData?.src}
            width={"auto"}
          />

          <div className="flex min-w-[65vh] max-w-[65vh] flex-col justify-evenly gap-1">
            {imageData?.prompt && (
              <div className="w-full rounded-xl bg-black/30 p-3">
                <ScrollArea className="max-h-[50px]">
                  <div className="font-medium">Your Prompt:</div>

                  <div className="text-sm text-foreground-500">
                    {imageData.prompt}
                  </div>
                </ScrollArea>
              </div>
            )}
            {imageData?.improvedPrompt && (
              <div className="w-full rounded-xl bg-black/30 p-3">
                <ScrollArea className="h-[70px]">
                  <div className="font-medium">Improved Prompt:</div>
                  <div className="text-sm text-foreground-500">
                    {imageData.improvedPrompt}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <ChatBubble_Actions_Image
            fullWidth
            imagePrompt={imageData?.prompt}
            setOpenImage={setOpenImage}
            src={imageData?.src}
          />
        </DialogContent>
      </Dialog>

      {convoMessages?.map((message: MessageType, index: number) =>
        message.type === "bot" ? (
          <div key={index} className="relative flex items-end gap-2">
            <Image
              alt="GAIA Logo"
              src={"/branding/logo.png"}
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
            src={"/branding/logo.png"}
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
