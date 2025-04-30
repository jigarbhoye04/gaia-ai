"use client";

import { useRouter } from "next/navigation";

import { ChatBubbleAddIcon, NotificationIcon } from "@/components/Misc/icons";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/useConversation";

export default function DefaultHeader() {
  const router = useRouter();
  const { clearMessages } = useConversation();

  return (
    <>
      <div />
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
        <Button
          aria-label="Notifications"
          className={`group rounded-lg hover:bg-[#00bbff]/20`}
          size="icon"
          variant={"ghost"}
          onClick={() => {
            router.push("/notifications");
            clearMessages();
          }}
        >
          <NotificationIcon className="min-h-[20px] min-w-[20px] text-zinc-400 transition-all group-hover:text-primary" />
        </Button>
      </div>
    </>
  );
}
