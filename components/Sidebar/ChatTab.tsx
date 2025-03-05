import { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Star } from "lucide-react";

import { Button } from "../ui/button";

import ChatOptionsDropdown from "./ChatOptionsDropdown";

import { BubbleConversationChatIcon } from "@/components/Misc/icons";

interface ChatTabProps {
  name: string;
  id: string;
  starred: boolean;
}

export const ChatTab: FC<ChatTabProps> = ({ name, id, starred }) => {
  const router = useRouter();
  const [currentConvoId, setCurrentConvoId] = useState<string | null>(null);
  const [buttonHovered, setButtonHovered] = useState(false);

  useEffect(() => {
    const pathParts = router.pathname.split("/");

    setCurrentConvoId(pathParts[pathParts.length - 1]);
  }, [router.pathname]);

  return (
    <div
      className="relative flex"
      onMouseOut={() => setButtonHovered(false)}
      onMouseOver={() => setButtonHovered(true)}
    >
      <Button
        className={`w-full flex justify-start pr-0 pl-2 h-[32px] min-h-[32px] font-normal duration-0 hover:bg-white/10 bg-transparent ${
          currentConvoId === id ? "text-primary" : "text-white"
        }`}
        onClick={() => {
          setButtonHovered(false);
          router.push(`/c/${id}`);
        }}
      >
        <div className="flex items-center gap-2 w-full">
          {starred ? (
            <Star
              className="min-w-[17px] w-[17px]"
              color={currentConvoId === id ? "#00bbff" : "#9b9b9b"}
              width="19"
            />
          ) : (
            <BubbleConversationChatIcon
              className="min-w-[17px] w-[17px]"
              color={currentConvoId === id ? "#00bbff" : "#9b9b9b"}
              width="19"
            />
          )}
          <span className="truncate w-[calc(100%-45px)] text-left">
            {name.replace('"', "")}
          </span>
        </div>
      </Button>

      <div
        className={`absolute right-0 ${
          buttonHovered ? "bg-black/20 backdrop-blur-md " : "bg-transparent"
        } rounded-full`}
      >
        <ChatOptionsDropdown
          buttonHovered={buttonHovered}
          chatId={id}
          chatName={name}
          starred={starred}
        />
      </div>
    </div>
  );
};
