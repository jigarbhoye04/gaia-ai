import Image from "next/image";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatBubble_Actions_Image from "./ChatBubbles/Actions/ChatBubble_Actions_Image";

interface ImageData {
  src?: string;
  prompt?: string;
  improvedPrompt?: string;
}

interface GeneratedImageSheetProps {
  openImage: boolean;
  setOpenImage?: React.Dispatch<React.SetStateAction<boolean>>;
  imageData?: ImageData;
}

export default function GeneratedImageSheet({
  openImage,
  setOpenImage,
  imageData,
}: GeneratedImageSheetProps) {
  return (
    <Sheet open={openImage} onOpenChange={setOpenImage}>
      <SheetContent className="flex min-w-fit max-w-screen-sm flex-col items-center !rounded-3xl border-none bg-zinc-900 px-5 py-3 text-white">
        <div className="relative flex aspect-square w-screen max-w-screen-sm">
          {imageData?.src && (
            <Image
              alt={"Generated Image"}
              className="my-2 aspect-square rounded-3xl"
              fill={true}
              src={imageData.src}
              objectFit="contain"
            />
          )}
        </div>

        <div className="mt-3 flex w-screen max-w-screen-sm flex-col justify-evenly gap-3">
          {imageData?.prompt && (
            <div className="w-full">
              <ScrollArea className="max-h-[50px]">
                <div className="font-medium">Your Prompt:</div>

                <div className="text-sm text-foreground-500">
                  {imageData.prompt}
                </div>
              </ScrollArea>
            </div>
          )}
          {imageData?.improvedPrompt && (
            <div className="w-full">
              <ScrollArea className="h-[70px]">
                <div className="font-medium">Improved Prompt:</div>
                <div className="text-sm text-foreground-500">
                  {imageData.improvedPrompt}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {imageData?.src && (
          <ChatBubble_Actions_Image
            fullWidth
            imagePrompt={imageData?.prompt}
            setOpenImage={setOpenImage}
            src={imageData.src}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
