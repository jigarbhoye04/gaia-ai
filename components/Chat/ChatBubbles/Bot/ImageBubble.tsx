// ImageBubble.tsx
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { parseDate } from "@/utils/fetchDate";
import { ChatBubbleBotProps } from "@/types/chatBubbleTypes";

export default function ImageBubble({
  text,
  loading,
  imageSrc,
  imagePrompt,
  improvedImagePrompt,
  date,
  setOpenImage,
  setImageData,
}: ChatBubbleBotProps) {
  return (
    <>
      <div className="chat_bubble bg-zinc-800">
        <div className="text-sm font-medium w-full flex flex-col gap-2 flex-wrap max-w-[350px] my-1">
          <span>{text}</span>
          <Skeleton
            className="rounded-3xl my-2 max-w-[250px] min-w-[250px] max-h-[250px] min-h-[250px] aspect-square"
            isLoaded={!loading && !!imageSrc}
          >
            <img
              alt="Generated Image"
              className="rounded-3xl my-2 !cursor-pointer"
              height="250px"
              src={imageSrc as string}
              width="250px"
              onClick={() => {
                if (imageSrc) {
                  setOpenImage(true);
                  setImageData({
                    prompt: imagePrompt,
                    src: imageSrc,
                    improvedPrompt: improvedImagePrompt,
                  });
                }
              }}
            />
          </Skeleton>
          {imagePrompt && (
            <div className="flex gap-1 justify-start flex-wrap max-w-[250px]">
              {imagePrompt.split(",").map((keyword, index) => (
                <Chip
                  key={index}
                  className="text-wrap min-h-fit py-1"
                  color="default"
                  radius="md"
                  size="sm"
                >
                  {keyword.trim()}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>
      {date && (
        <span className="text-xs text-white text-opacity-40 flex flex-col select-text pt-1">
          {parseDate(date)}
        </span>
      )}
    </>
  );
}
