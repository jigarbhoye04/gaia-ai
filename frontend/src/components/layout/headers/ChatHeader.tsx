"use client";

import { useParams, useRouter } from "next/navigation";

import ChatOptionsDropdown from "@/components/layout/sidebar/ChatOptionsDropdown";
import { NotificationCenter } from "@/components/Notifications/NotificationCenter";
import {
  BubbleConversationChatIcon,
  ChatBubbleAddIcon,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/shadcn/button";
import { useConversation } from "@/features/chat/hooks/useConversation";
import { useConversationList } from "@/features/chat/hooks/useConversationList";

export default function ChatHeader() {
  const router = useRouter();
  const { conversations } = useConversationList();
  const { id: convoIdParam } = useParams<{ id: string }>();
  const { clearMessages } = useConversation();

  return (
    <div className="flex w-full justify-between pb-3">
      <div />
      <div className="flex">
        {convoIdParam && (
          <ChatOptionsDropdown
            btnChildren={
              <div className="flex max-w-[250px] items-center gap-2 truncate text-sm!">
                <BubbleConversationChatIcon height={18} width={18} />

                {conversations.find(
                  (convo) => convo.conversation_id == convoIdParam,
                )?.description || "New chat"}
              </div>
            }
            buttonHovered={true}
            chatId={convoIdParam}
            chatName={
              conversations.find(
                (convo) => convo.conversation_id == convoIdParam,
              )?.description || "New chat"
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
          <ChatBubbleAddIcon className="min-h-[20px] min-w-[20px] text-zinc-400 transition-all group-hover:text-primary" />
        </Button>
        <NotificationCenter />
      </div>
    </div>
  );
}
