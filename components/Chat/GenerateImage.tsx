import { useConversationList } from "@/contexts/ConversationList";
import { ApiService } from "@/services/apiService";
import { MessageType } from "@/types/convoTypes";
import api from "@/utils/apiaxios";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import ObjectID from "bson-objectid";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import fetchDate from "../../utils/fetchDate";
import { BrushIcon } from "../Misc/icons";
import { useConversation } from "@/hooks/useConversation";

interface GenerateImageProps {
  openImageDialog: boolean;
  setOpenImageDialog: (open: boolean) => void;
}

export default function GenerateImage({
  openImageDialog,
  setOpenImageDialog,
}: GenerateImageProps) {
  const { updateConvoMessages } = useConversation();
  const { id: convoIdParam } = useParams<{ id: string }>();
  const [imagePrompt, setImagePrompt] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { fetchConversations } = useConversationList();

  useEffect(() => {
    setIsValid(imagePrompt.trim() !== "");
  }, [imagePrompt]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      setImagePrompt((text) => `${text}\n`);
    } else if (event.key === "Enter" && !loading && isValid) {
      handleSubmit();
    }
  };

  const handleInputChange = (value: string) => {
    setImagePrompt(value);
    setIsValid(value.trim() !== "");
  };

  /**
   * Updates conversation both in UI state and (via ApiService) in the DB.
   * When `replaceLastMessage` is true, the last message in state is removed.
   */
  const updateConversationState = async (
    conversationId: string,
    newMessages: MessageType[],
    description?: string,
    replaceLastMessage: boolean = false
  ) => {
    try {
      updateConvoMessages((prev) => {
        const baseMessages = replaceLastMessage ? prev.slice(0, -1) : prev;
        // Send only final messages to the DB
        ApiService.updateConversation(conversationId, newMessages);
        return [...baseMessages, ...newMessages];
      });

      ApiService.updateConversationDescription(
        conversationId,
        description || "New Chat",
        fetchConversations
      );
    } catch (error) {
      console.error("Failed to update conversation:", error);
      throw new Error("Failed to update conversation state");
    }
  };

  const generateImage = async (prompt: string): Promise<[string, string]> => {
    try {
      const response = await api.post(
        "/image/generate",
        { message: prompt },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      return [response.data.url, response.data.improved_prompt];
    } catch (error) {
      console.error("Image generation failed:", error);
      throw new Error("Failed to generate image");
    }
  };

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);

    try {
      const botMessageId = String(ObjectID());
      const userMessageId = String(ObjectID());

      // Create user message and a loading bot message (for UI only)
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

      const isNewConversation = !convoIdParam;
      let conversationId = convoIdParam || "";

      // Update UI state with user message and temporary loading state.
      if (isNewConversation) {
        // For new conversations, start a fresh state.
        updateConvoMessages([userMessage, botLoadingMessage]);
      } else {
        updateConvoMessages((prev: MessageType) => [
          ...(prev as MessageType),
          userMessage,
          botLoadingMessage,
        ]);
      }

      // If new conversation, create it in the DB now (but do not store the loading message)
      if (isNewConversation) {
        conversationId = crypto.randomUUID();
        await ApiService.createConversation(conversationId);
        router.push(`/c/${conversationId}`);
      }

      setOpenImageDialog(false);

      const [imageUrl, improvedPrompt] = await generateImage(imagePrompt);

      // Prepare final bot message without the loading flag.
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

      // Update UI: remove the loading message and add the final bot message.
      updateConvoMessages((prev) => {
        // If the last message is the loading message, replace it.
        if (prev.length && prev[prev.length - 1].loading) {
          return [...prev.slice(0, -1), finalBotMessage];
        }
        return [...prev, finalBotMessage];
      });

      // --- Update the DB with final messages only ---
      if (isNewConversation) {
        // For new conversations, store only [userMessage, finalBotMessage]
        await updateConversationState(
          conversationId,
          [userMessage, finalBotMessage],
          `Generate Image: ${imagePrompt}`,
          false
        );
      } else {
        // For existing conversations, replace the temporary loading message with the final bot message.
        await updateConversationState(
          conversationId,
          [finalBotMessage],
          undefined,
          true
        );
      }

      setImagePrompt("");
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        classNames: {
          toast: "flex items-center p-3 rounded-xl gap-3 w-[350px] toast_error",
          title: "text-sm",
          description: "text-sm",
        },
        duration: 3000,
        description:
          "There was a problem with generating images. Please try again later.\n",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      hideCloseButton
      backdrop="opaque"
      classNames={{ base: "w-full p-4 dark text-white" }}
      isOpen={openImageDialog}
      onOpenChange={setOpenImageDialog}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col items-center">
          Generate Image
        </ModalHeader>
        <ModalBody className="flex justify-center items-center lottie_container">
          <Textarea
            isRequired
            color="primary"
            isDisabled={loading}
            label="Describe the image you want to generate"
            labelPlacement="outside"
            maxRows={5}
            minRows={2}
            placeholder="e.g - Futuristic city skyline"
            size="lg"
            startContent={<BrushIcon />}
            value={imagePrompt}
            variant="faded"
            onValueChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </ModalBody>
        <ModalFooter className="flex w-full justify-center">
          <Button
            color="danger"
            radius="full"
            size="md"
            variant="light"
            onPress={() => setOpenImageDialog(false)}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={!isValid}
            isLoading={loading}
            radius="full"
            size="md"
            onPress={handleSubmit}
          >
            {loading ? "Generating" : "Generate"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
