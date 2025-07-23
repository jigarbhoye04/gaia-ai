import { Chip } from "@heroui/chip";
import { ArrowUpRight } from "lucide-react";

import { StarsIcon } from "@/components/shared/icons";
import SelectedToolIndicator from "@/features/chat/components/composer/SelectedToolIndicator";
import { ChatBubbleUserProps } from "@/types/features/chatBubbleTypes";
import { parseDate } from "@/utils/date/dateUtils";

import ChatBubbleFilePreview from "./ChatBubbleFilePreview";

export default function ChatBubbleUser({
  text,
  date,
  message_id,
  fileData = [],
  selectedTool,
  toolCategory,
}: ChatBubbleUserProps) {
  const hasContent = !!text || fileData.length > 0 || !!selectedTool;

  if (!hasContent) return null;

  return (
    <>
      <div className="chat_bubble_container user group" id={message_id}>
        {fileData.length > 0 && <ChatBubbleFilePreview files={fileData} />}

        {selectedTool && (
          <div className="flex justify-end">
            <SelectedToolIndicator
              toolName={selectedTool}
              toolCategory={toolCategory}
            />
          </div>
        )}

        {text?.trim() && (
          <div className="chat_bubble user">
            {!!text && (
              <div className="flex max-w-[30vw] text-wrap whitespace-pre-wrap select-text">
                {text}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end opacity-0 transition-all group-hover:opacity-100">
          {date && (
            <span className="text-opacity-45 flex flex-col pt-[2px] text-xs text-white select-text">
              {parseDate(date)}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
