// ImageBubble.tsx
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import Image from "next/image";

import { ChatBubbleBotProps } from "@/types/chatBubbleTypes";

export default function ImageBubble({
  text,
  loading,
  imageSrc,
  imagePrompt,
  improvedImagePrompt,
  setOpenImage,
  setImageData,
}: ChatBubbleBotProps) {
  if (!imageSrc && !loading) return null;

  return (
    <div className="chat_bubble bg-zinc-800">
      <div className="my-1 flex w-full max-w-[350px] flex-col flex-wrap gap-2 text-sm font-medium">
        <span>{text}</span>
        <Skeleton
          className="my-2 aspect-square max-h-[250px] min-h-[250px] min-w-[250px] max-w-[250px] rounded-3xl"
          isLoaded={!loading && Boolean(imageSrc)}
        >
          {imageSrc && (
            <Image
              alt="Generated Image"
              className="my-2 !cursor-pointer rounded-3xl"
              height={250}
              width={250}
              src={imageSrc}
              onClick={() => {
                setOpenImage(true);
                setImageData({
                  prompt: imagePrompt ?? "",
                  src: imageSrc,
                  improvedPrompt: improvedImagePrompt ?? "",
                });
              }}
            />
          )}
        </Skeleton>
        {imagePrompt && (
          <div className="flex max-w-[250px] flex-wrap justify-start gap-1">
            {imagePrompt.split(",").map((keyword, index) => (
              <Chip
                key={index}
                className="min-h-fit text-wrap py-1"
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
  );
}
