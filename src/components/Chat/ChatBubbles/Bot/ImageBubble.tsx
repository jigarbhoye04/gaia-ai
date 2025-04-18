// ImageBubble.tsx
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
    <>
      <Skeleton
        className="mb-4 aspect-square max-h-[350px] min-h-[350px] max-w-[350px] min-w-[350px] overflow-hidden rounded-3xl"
        isLoaded={!loading && Boolean(imageSrc)}
      >
        {imageSrc && (
          <Image
            alt="Generated Image"
            className="my-2 cursor-pointer! rounded-3xl"
            height={500}
            width={500}
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
      <div className="chat_bubble bg-zinc-800">
        {/* <div className="my-1 flex w-full max-w-[400px] flex-col flex-wrap gap-1 text-sm font-medium"> */}
        <span>{text}</span>

        {/* </div> */}
      </div>
    </>
  );
}
