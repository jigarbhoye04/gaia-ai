import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { XIcon } from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import React from "react";

import TextToSpeech from "../../Audio/TextToSpeechComponent";
import { DownloadSquare01Icon, PinIcon, Task01Icon } from "../../Misc/icons";

import { ApiService } from "@/utils/chatUtils";
import { apiauth } from "@/utils/apiaxios";
import { useConvo } from "@/contexts/CurrentConvoMessages";

interface ChatBubbleActionsProps {
  loading: boolean;
  text: string;
  pinned?: boolean;
  message_id: string;
}

export function ChatBubble_Actions({
  message_id,
  loading,
  text,
  pinned = false,
}: ChatBubbleActionsProps): JSX.Element {
  const router = useRouter();
  const { setConvoMessages } = useConvo();

  const { convoIdParam } = router.query;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    toast.info("Copied to clipboard", {
      description: `${text.slice(0, 30)}...`,
    });

    // toast.success("Copied to clipboard", {
    //   unstyled: true,
    //   classNames: {
    //     toast: "flex items-center p-3 rounded-xl gap-3 w-[350px] toast_custom",
    //     title: "text-black text-sm",
    //     description: "text-sm text-black",
    //   },
    //   duration: 3000,
    //   description: `${text.substring(0, 35)}...`,
    //   icon: <Task01Icon color="black" height="23" />,
    // });
  };

  const handlePinToggle = async () => {
    try {
      if (!convoIdParam) return;

      // Fetch updated messages first
      // const messages = await ApiService.fetchMessages(convoIdParam);
      // setConvoMessages(messages);

      if (!message_id) return;

      // Pin/unpin the message
      await apiauth.put(
        `/conversations/${convoIdParam}/messages/${message_id}/pin`,
        { pinned: !pinned }
      );

      toast.success("Pinned message!");

      // Fetch messages again to reflect the pin state
      const updatedMessages = await ApiService.fetchMessages(
        convoIdParam as string
      );

      setConvoMessages(updatedMessages);
    } catch (error) {
      toast.error("Could not pin this message");
      console.error("Could not pin this message", error);
    }
  };

  return (
    <>
      {!loading && (
        <div className="flex w-fit gap-2 items-center">
          <Button
            isIconOnly
            className="w-fit p-0 h-fit rounded-md"
            style={{ minWidth: "22px" }}
            variant="light"
            onPress={copyToClipboard}
          >
            <Task01Icon className="cursor-pointer" height="22" width="22" />
          </Button>

          <Button
            isIconOnly
            className="w-fit p-0 h-fit rounded-md"
            variant="light"
            onClick={handlePinToggle}
            color={pinned ? "primary" : "default"}
            // variant={pinned ? "solid" : "light"}
            style={{ minWidth: "22px" }}
          >
            <PinIcon
              className={`cursor-pointer`}
              color={pinned ? "#00bbff" : "#9b9b9b"}
              fill={pinned ? "#00bbff" : "transparent"}
              height="22"
              width="22"
            />
          </Button>
          {/*
          <TranslateDropdown
            text={text}
            index={index}
            trigger={
              <Button
                variant="light"
                className="w-fit p-0 h-fit rounded-md"
                isIconOnly
                style={{ minWidth: "22px" }}
              >
                <TranslateIcon height="22" className="cursor-pointer" />
              </Button>
            }
          /> */}

          <TextToSpeech text={text} />
        </div>
      )}
    </>
  );
}

interface ChatBubbleActionsImageProps {
  src: string;
  imagePrompt: string | undefined;
  fullWidth?: boolean;
  setOpenImage?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ChatBubble_Actions_Image({
  src,
  imagePrompt,
  fullWidth = false,
  setOpenImage,
}: ChatBubbleActionsImageProps): JSX.Element {
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
    <div className="flex py-2 w-fit gap-2 items-center">
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
              ? "px-3 py-2 "
              : "p-0 bg-transparent data-[hover=true]:bg-transparent"
          } h-fit rounded-lg `}
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
          <span className="text-black font-medium">
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
