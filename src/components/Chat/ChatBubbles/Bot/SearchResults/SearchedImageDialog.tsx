import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { closeImageDialog } from "@/redux/slices/imageDialogSlice";
import { RootState } from "@/redux/store";

export default function SearchedImageDialog() {
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
          <div className="flex h-full w-full flex-col gap-4 pt-8">
            <div className="relative h-fit max-h-[70vh] w-full overflow-y-auto rounded-lg">
              <Image
                src={selectedImage.url}
                alt={selectedImage.title || "Search Result Image"}
                width={800}
                height={1200}
                className="w-full rounded-lg object-cover"
              />
            </div>

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
