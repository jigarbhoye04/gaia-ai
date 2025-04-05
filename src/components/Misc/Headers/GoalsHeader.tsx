"use client";

import { useRouter } from "next/navigation";

import { ChatBubbleAddIcon, Target02Icon } from "@/components/Misc/icons";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/useConversation";

import HeaderComponent from "./HeaderComponent";

export default function GoalsHeader() {
  const router = useRouter();
  const { clearMessages } = useConversation();

  return (
    <>
      <HeaderComponent title="Goals" icon={<Target02Icon />} />
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
      </div>
    </>
  );
}
