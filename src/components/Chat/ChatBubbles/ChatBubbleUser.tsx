import { Chip } from "@heroui/chip";
import { ArrowUpRight, File } from "lucide-react";

// import { PdfContainer } from "../../Documents/PdfComponent";
import { StarsIcon } from "@/components/Misc/icons";
import { ChatBubbleUserProps } from "@/types/chatBubbleTypes";

import { parseDate } from "../../../utils/fetchDate";

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
              <div className="flex items-center gap-1 text-white">
                Fetching
                <a
                  className="font-medium !text-white transition-colors hover:!text-black"
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
            <div className="mb-2 rounded-xl bg-black/30 p-3 text-white">
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
            <div className="flex max-w-[30vw] select-text whitespace-pre-wrap text-wrap">
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
        <div className="flex justify-end opacity-0 transition-all group-hover:opacity-100">
          {date && (
            <span className="flex select-text flex-col pt-[2px] text-xs text-white text-opacity-45">
              {parseDate(date)}
            </span>
          )}
        </div>
      </div>
    )
  );
}
