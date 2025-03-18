import { Chip } from "@heroui/chip";
import { ArrowUpRight, File } from "lucide-react";

import { parseDate } from "../../../utils/fetchDate";

import { ChatBubbleUserProps } from "@/types/chatBubbleTypes";

// import { PdfContainer } from "../../Documents/PdfComponent";
import { StarsIcon } from "@/components/Misc/icons";

export default function ChatBubbleUser({
  text,
  // subtype = null,
  filename,
  date,
  searchWeb = false,
  pageFetchURL,
  message_id,
}: ChatBubbleUserProps) {
  return (
    !!text && (
      <div className="chat_bubble_container user group" id={message_id}>
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

          {!!pageFetchURL && (
            <Chip
              className="mb-2"
              startContent={<ArrowUpRight color="white" height={20} />}
              variant="flat"
            >
              <div className="flex items-center gap-1 text-white ">
                Fetching
                <a
                  className="!text-white font-medium hover:!text-black transition-colors"
                  href={pageFetchURL}
                  rel="noreferrer"
                  target="_blank"
                >
                  {pageFetchURL.replace(/^https?:\/\//, "")}{" "}
                </a>
              </div>
            </Chip>
          )}
          {/* 
      {!!pageFetchURL && (
        <Chip
          startContent={<ArrowUpRight height={20} color="#00bbff" />}
          // endContent={
          //   <StarsIcon height={20} color="transparent" fill="white" />
          // }
          variant="flat"
          color="primary"
        >
          <div className="font-medium flex items-center gap-1 text-primary">
            {pageFetchURL}
          </div>
        </Chip>
      )} */}

          {filename && (
            <div className="bg-black/30 rounded-xl p-3 text-white mb-2">
              <div className="flex items-center gap-3">
                <File />
                <div>
                  <div className="font-medium">
                    {filename?.split(".")[0].slice(0, 25)}
                    {filename?.length > 25 ? "... " : "."}
                    {filename?.split(".")[1]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!!text && (
            <div className="flex select-text text-wrap max-w-[30vw] whitespace-pre-wrap">
              {text}
            </div>
          )}

          {/* {subtype === "image" && typeof file === "string" && (
        <div className="flex flex-col items-center gap-2 max-w-[250px] whitespace-nowrap text-ellipsis overflow-hidden">
          {/* <img
            src={file} // Ensured this is a string by checking the type
            width={"250px"}
            height={"250px"}
            content-type="image/png"
            className="rounded-2xl mt-1"
          /> 
          {filename && (
            <Chip
              color="default"
              size="sm"
              className="text-white bg-opacity-70 max-w-[250px]"
            >
              {filename}
            </Chip>
          )}
        </div>
      )} */}

          {/* {subtype === "pdf" && file instanceof File && (
        <PdfContainer file={file} chat_bubble={true} />
      )} */}
        </div>
        <div className="flex justify-end group-hover:opacity-100 opacity-0 transition-all">
          {date && (
            <span className="text-xs text-white text-opacity-45 flex flex-col select-text pt-[2px]">
              {parseDate(date)}
            </span>
          )}
        </div>
      </div>
    )
  );
}
