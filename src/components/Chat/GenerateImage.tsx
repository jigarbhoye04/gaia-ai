import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";

import { useConversation } from "@/hooks/useConversation";
import { useLoading } from "@/hooks/useLoading";
import { MessageType } from "@/types/convoTypes";
import { apiauth } from "@/utils/apiaxios";
import fetchDate from "@/utils/fetchDate";

interface GenerateImageProps {
  openImageDialog: boolean;
  setOpenImageDialog: (open: boolean) => void;
}

export default function GenerateImage({
  openImageDialog,
  setOpenImageDialog,
}: GenerateImageProps) {
  const { updateConvoMessages, convoMessages } = useConversation();
  const { setIsLoading } = useLoading();
  const [imagePrompt, setImagePrompt] = useState("");
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setIsValid(imagePrompt.trim() !== "");
  }, [imagePrompt]);

  const handleInputChange = (value: string) => {
    setImagePrompt(value);
    setIsValid(value.trim() !== "");
  };

  const generateImage = async (prompt: string): Promise<[string, string]> => {
    try {
      const response = await apiauth.post(
        "/image/generate",
        { message: prompt },
        {
          headers: { "Content-Type": "application/json" },
        },
      );
      return [response.data.url, response.data.improved_prompt];
    } catch (error) {
      console.error("Image generation failed:", error);
      throw new Error("Failed to generate image");
    }
  };

  const generateUniqueId = () => {
    return crypto.randomUUID();
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsLoading(true);

    try {
      const botMessageId = generateUniqueId();
      const userMessageId = generateUniqueId();

      const userMessage: MessageType = {
        type: "user",
        response: `Generate Image:\n${imagePrompt}`,
        date: fetchDate(),
        message_id: userMessageId,
      };

      const botLoadingMessage: MessageType = {
        type: "bot",
        response: "Generating Image...",
        date: fetchDate(),
        loading: true,
        imagePrompt,
        isImage: true,
        message_id: botMessageId,
      };

      updateConvoMessages([...convoMessages, userMessage, botLoadingMessage]);
      setOpenImageDialog(false);

      const [imageUrl, improvedPrompt] = await generateImage(imagePrompt);

      const finalBotMessage: MessageType = {
        type: "bot",
        response: "Here is your generated image",
        date: fetchDate(),
        imageUrl,
        imagePrompt,
        improvedImagePrompt: improvedPrompt,
        isImage: true,
        loading: false,
        message_id: botMessageId,
      };

      updateConvoMessages([...convoMessages, finalBotMessage]);
    } catch (error) {
      toast.error("Error generating image. Please try again later.");
      console.error("Error generating image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={openImageDialog}
      onOpenChange={setOpenImageDialog}
      backdrop="opaque"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col items-center">
          Generate Image
        </ModalHeader>
        <ModalBody className="flex items-center justify-center">
          <Textarea
            isRequired
            color="primary"
            isDisabled={false}
            label="Describe the image you want to generate"
            placeholder="e.g - Futuristic city skyline"
            value={imagePrompt}
            onValueChange={handleInputChange}
          />
        </ModalBody>
        <ModalFooter className="flex w-full justify-center">
          <Button
            color="danger"
            radius="full"
            size="md"
            onPress={() => setOpenImageDialog(false)}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={!isValid}
            radius="full"
            size="md"
            onPress={handleSubmit}
          >
            Generate
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
