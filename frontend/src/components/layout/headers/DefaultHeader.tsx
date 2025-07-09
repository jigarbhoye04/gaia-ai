"use client";

import { useRouter } from "next/navigation";

import { NotificationCenter } from "@/components/Notifications/NotificationCenter";
import { ChatBubbleAddIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/shadcn/button";
import { useConversation } from "@/features/chat/hooks/useConversation";

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
        <NotificationCenter />
      </div>
    </>
  );
}
