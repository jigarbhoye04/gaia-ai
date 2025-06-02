import { Chip } from "@heroui/chip";
import { ArrowUpRight } from "lucide-react";

import { StarsIcon } from "@/components/shared/icons";
import { ChatBubbleUserProps } from "@/types/features/chatBubbleTypes";
import { parseDate } from "@/utils/date/dateUtils";

import ChatBubbleFilePreview from "./ChatBubbleFilePreview";

export default function ChatBubbleUser({
  text,
  date,
  searchWeb = false,
  pageFetchURLs,
  message_id,
  fileData = [],
}: ChatBubbleUserProps) {
  const hasContent =
    !!text ||
    fileData.length > 0 ||
    searchWeb ||
    (pageFetchURLs && pageFetchURLs.length > 0);

  if (!hasContent) return null;

  return (
    <>
      <div className="chat_bubble_container user group" id={message_id}>
        {fileData.length > 0 && <ChatBubbleFilePreview files={fileData} />}

        <div className="chat_bubble user">
          {searchWeb && (
            <Chip
              className="mb-2"
              endContent={
                <StarsIcon
                  className="mr-1"
                  color="transparent"
                  fill="white"
                  height={22}
                />
              }
              variant="flat"
            >
              <div className="flex items-center gap-1 font-medium text-white">
                Searching the Web
              </div>
            </Chip>
          )}

          {pageFetchURLs?.map((url, index) => (
            <Chip
              key={index}
              className="mb-2"
              startContent={<ArrowUpRight color="white" height={20} />}
              variant="flat"
            >
              <div className="flex items-center gap-1 text-white">
                Fetching
                <a
                  className="font-medium text-white! transition-colors hover:text-black!"
                  href={url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {url.replace(/^https?:\/\//, "")}{" "}
                </a>
              </div>
            </Chip>
          ))}

          {!!text && (
            <div className="flex max-w-[30vw] text-wrap whitespace-pre-wrap select-text">
              {text}
            </div>
          )}
        </div>

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
