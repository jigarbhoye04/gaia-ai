import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { closeImageDialog } from "@/redux/slices/imageDialogSlice";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

export default function ImageDialog() {
  const dispatch = useDispatch();
  const { isOpen, selectedImage } = useSelector(
    (state: RootState) => state.imageDialog,
  );

  return (
    <Sheet open={isOpen} onOpenChange={() => dispatch(closeImageDialog())}>
      <SheetContent
        side="right"
        className="border-none bg-zinc-800 duration-100 sm:max-w-2xl"
      >
        {selectedImage && (
          <div className="flex h-full flex-col gap-4 pt-8">
            <Image
              src={selectedImage.url}
              alt={selectedImage.title || "Search Result Image"}
              width={800}
              height={800}
              className="max-h-[60vh] w-full rounded-3xl object-contain"
            />

            <div className="flex flex-col gap-2">
              {selectedImage.title && (
                //   <div className="text-xl font-medium text-foreground">
                <a
                  href={selectedImage.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-medium text-foreground transition hover:text-primary"
                >
                  {selectedImage.title}
                </a>
              )}

              {selectedImage.source && (
                <div className="">
                  <ScrollArea className="max-h-[50px]">
                    <a
                      href={selectedImage.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground-500 transition hover:text-primary"
                    >
                      {selectedImage.source}
                    </a>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
