import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { XIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { DownloadSquare01Icon } from "../../../Misc/icons";

interface ChatBubbleActionsImageProps {
  src: string;
  imagePrompt: string | undefined;
  fullWidth?: boolean;
  setOpenImage?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ChatBubble_Actions_Image({
  src,
  imagePrompt,
  fullWidth = false,
  setOpenImage,
}: ChatBubbleActionsImageProps) {
  const downloadFromSrc = async () => {
    try {
      // Get current date and time for filename
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");

      // Sanitize and truncate the prompt
      const sanitizedPrompt = imagePrompt
        ?.replace(/[^\w\s-]/g, "")
        .slice(0, 50);
      const fileName = `G.A.I.A ${date} ${time} ${sanitizedPrompt}.png`;

      // Fetch the image as a blob
      const response = await fetch(src);
      const blob = await response.blob();

      // Create URL from blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create download link
      const downloadLink = document.createElement("a");

      downloadLink.href = blobUrl;
      downloadLink.download = fileName;

      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Cleanup
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      // You might want to show a toast notification here
      toast.error("Failed to download image", {
        description: "Please try again later",
      });
    }
  };

  return (
    <div className="flex w-fit items-center gap-2 py-2">
      <Tooltip
        className={`${fullWidth ? "hidden" : ""}`}
        color="primary"
        content="Download Image"
        placement="right"
        size="md"
      >
        <Button
          className={`w-fit ${
            fullWidth
              ? "px-3 py-2"
              : "bg-transparent p-0 data-[hover=true]:bg-transparent"
          } h-fit rounded-lg`}
          color="primary"
          isIconOnly={!fullWidth}
          style={{ minWidth: "22px" }}
          variant={fullWidth ? "solid" : "light"}
          onPress={downloadFromSrc}
        >
          <DownloadSquare01Icon
            className={`cursor-pointer ${fullWidth ? "text-black" : ""}`}
            height="22"
          />
          <span className="font-medium text-black">
            {fullWidth ? "Download" : ""}
          </span>
        </Button>
      </Tooltip>
      {fullWidth && setOpenImage ? (
        <Button
          color="danger"
          variant="ghost"
          onPress={() => setOpenImage(false)}
        >
          <XIcon height="22" />
          <span className="font-medium">Cancel</span>
        </Button>
      ) : (
        <></>
      )}
    </div>
  );
}
