"use client";

import { useParams, useRouter } from "next/navigation";

import {
  BubbleConversationChatIcon,
  ChatBubbleAddIcon,
} from "@/components/Misc/icons";
import ChatOptionsDropdown from "@/components/Sidebar/ChatOptionsDropdown";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/useConversation";
import { useConversationList } from "@/hooks/useConversationList";

export default function ChatHeader() {
  const router = useRouter();
  const { conversations } = useConversationList();
  const { id: convoIdParam } = useParams<{ id: string }>();
  const { clearMessages } = useConversation();

  return (
    <div className="flex w-full justify-between">
      <div />
      <div className="flex">
        {convoIdParam && (
          <ChatOptionsDropdown
            btnChildren={
              <div className="flex max-w-[250px] items-center gap-2 truncate !text-sm">
                <BubbleConversationChatIcon height={18} width={18} />

                {conversations.find(
                  (convo) => convo.conversation_id == convoIdParam,
                )?.description || "New Chat"}
              </div>
            }
            buttonHovered={true}
            chatId={convoIdParam}
            chatName={
              conversations.find(
                (convo) => convo.conversation_id == convoIdParam,
              )?.description || "New Chat"
            }
            logo2={true}
            starred={
              conversations.find(
                (convo) => convo.conversation_id == convoIdParam,
              )?.starred || false
            }
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button
          aria-label="Create new chat"
          className={`group rounded-lg hover:bg-[#00bbff]/20`}
          size="icon"
          variant={"ghost"}
          onClick={() => {
            router.push("/c");
            clearMessages();
          }}
        >
          <ChatBubbleAddIcon className="text-zinc-400 transition-all group-hover:text-primary" />
        </Button>
        {/* <Button
          aria-label="Notifications"
          className={`group rounded-lg hover:bg-[#00bbff]/20`}
          size="icon"
          variant={"ghost"}
          onClick={() => {
            router.push("/notifications");
            clearMessages();
          }}
        >
          <NotificationIcon className="text-zinc-400 transition-all group-hover:text-primary" />
        </Button> */}
      </div>
    </div>
  );
}
