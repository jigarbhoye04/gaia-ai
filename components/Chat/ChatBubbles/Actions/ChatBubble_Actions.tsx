import { Button } from "@heroui/button";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import TextToSpeech from "@/components/Audio/TextToSpeechComponent";
import { PinIcon, Task01Icon } from "@/components/Misc/icons";

import { useConvo } from "@/contexts/CurrentConvoMessages";
import { apiauth } from "@/utils/apiaxios";
import { ApiService } from "@/utils/chatUtils";

interface ChatBubbleActionsProps {
  loading: boolean;
  text: string;
  pinned?: boolean;
  message_id: string;
}

export default function ChatBubble_Actions({
  message_id,
  loading,
  text,
  pinned = false,
}: ChatBubbleActionsProps): JSX.Element {
  const { id: convoIdParam } = useParams<{ convoIdParam: string }>();
  const { setConvoMessages } = useConvo();

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
      const updatedMessages = await ApiService.fetchMessages(convoIdParam);

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
