// ChatRenderer.tsx
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import ChatBubble_Actions_Image from "./ChatBubbles/Actions/ChatBubble_Actions_Image";
import ChatBubbleBot from "./ChatBubbles/Bot/ChatBubbleBot";
import ChatBubbleUser from "./ChatBubbles/ChatBubbleUser";
import StarterText from "@/components/Chat/StarterText";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useConversationList } from "@/contexts/ConversationList";
import { useConvo } from "@/contexts/CurrentConvoMessages";
import { useSearchParams } from "next/navigation";

export default function ChatRenderer() {
  const { convoMessages } = useConvo();
  const { conversations } = useConversationList();
  const [openImage, setOpenImage] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const messageId = searchParams.get("messageId");
  const { id: convoIdParam } = useParams();

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
      <div className="flex items-start justify-center flex-1">
        <div className="flex items-center justify-center flex-col gap-2">
          <div className="pingspinner sm:!min-w-[10vw] sm:!min-h-[10vw] !min-w-[30vw] !min-h-[30vw] aspect-square" />
          {/* <StarterEmoji /> */}
          {/* <img
            src={"/gaialogo.png"}
            width={200}
            height={200}
            className="animate-bounce2"
          /> */}
          <StarterText />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* {conversations.find()} */}
      {/* Image Generation Dialog Box */}
      <title id="chat_title">
        {`${
          conversations.find((convo) => convo.conversation_id === convoIdParam)
            ?.description || ""
        }` || "GAIA"}
      </title>

      <Dialog open={openImage} onOpenChange={setOpenImage}>
        <DialogContent className="!rounded-3xl bg-zinc-800 border-none text-white flex items-center flex-col min-w-fit py-3 px-5">
          <img
            alt={"Generated Image"}
            className="rounded-3xl my-2 size-[65vh] min-w-[65vh] min-h-[65vh] aspect-square"
            height={"auto"}
            src={imageData?.src}
            width={"auto"}
          />

          <div className="flex max-w-[65vh] min-w-[65vh] justify-evenly flex-col gap-1">
            {imageData?.prompt && (
              <div className="w-full bg-black/30 p-3 rounded-xl">
                <ScrollArea className="max-h-[50px]">
                  <div className="font-medium">Your Prompt:</div>

                  <div className="text-foreground-500 text-sm">
                    {imageData.prompt}
                  </div>
                </ScrollArea>
              </div>
            )}
            {imageData?.improvedPrompt && (
              <div className="w-full bg-black/30 p-3 rounded-xl">
                <ScrollArea className="h-[70px]">
                  <div className="font-medium">Improved Prompt:</div>
                  <div className="text-foreground-500 text-sm">
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

      {convoMessages?.map((message, index) =>
        message.type === "bot" ? (
          <div key={index} className="relative flex items-end gap-2">
            <div
              className={`pingspinner relative ${
                message.loading ? "bottom-3" : "bottom-9"
              }`}
            />
            {/* <img
              src={"/gaialogo.png"}
              width={40}
              height={40}
              className={`${
                message.loading ? "animate-spin" : ""
              } relative bottom-9`}
            /> */}
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
        )
      )}
    </>
  );
}
