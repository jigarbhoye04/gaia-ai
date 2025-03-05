import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import imageCompression from "browser-image-compression";
import { FileIcon } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ObjectID from "bson-objectid";
import { toast } from "sonner";
import { v1 as uuidv1 } from "uuid";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

import { useConversationList } from "@/contexts/ConversationList";
import { useConvo } from "@/contexts/CurrentConvoMessages";
import { MessageType } from "@/types/convoTypes";
import { apiauth } from "@/utils/apiaxios";
import { ApiService } from "@/utils/chatUtils";
import fetchDate from "@/utils/fetchDate";

interface FileUploadProps {
  isImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function FileUpload({
  isImage,
  fileInputRef,
}: FileUploadProps): JSX.Element {
  const { setConvoMessages } = useConvo();
  const { id: convoIdParam } = useParams();
  const { fetchConversations } = useConversationList();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  // const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsValid(textContent.trim() !== "");
  }, [textContent]);

  const closeModal = (): void => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTextContent("");
    setFile(null);
    setOpen(false);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    // setFileLoading(true);
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setOpen(true);

    if (isImage && selectedFile.size > 2000000) {
      try {
        const compressedFile = await imageCompression(selectedFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        setFile(compressedFile);
      } catch (error) {
        console.error("Image compression failed:", error);
      }
    } else {
      setFile(selectedFile);
    }
    // setFileLoading(false);
  };

  // const updateConversationState = async (
  //   conversationId: string,
  //   newMessages: MessageType[],
  //   description?: string,
  //   replaceLastMessage: boolean = false
  // ) => {
  //   try {
  //     setConvoMessages((prev) => {
  //       const baseMessages = replaceLastMessage ? prev.slice(0, -1) : prev;
  //       return [...baseMessages, ...newMessages];
  //     });

  //     const finalizedBotResponse: MessageType = {
  //       type: "bot",
  //       response: botResponseText,
  //       date: fetchDate(),
  //       loading: false,
  //       searchWeb: enableSearch,
  //       pageFetchURL,
  //     };

  //     currentMessages[currentMessages.length - 1] = finalizedBotResponse;

  //     await ApiService.updateConversation(conversationId, currentMessages);

  //     // ApiService.updateConversationDescription(
  //     //   conversationId,
  //     //   description || "New Chat",
  //     //   fetchConversations
  //     // );
  //   } catch (error) {
  //     console.error("Failed to update conversation:", error);
  //     throw new Error("Failed to update conversation state");
  //   }
  // };

  const createNewConversation = async (currentMessages: MessageType[]) => {
    const conversationId = uuidv1();

    try {
      await ApiService.createConversation(conversationId);

      setTimeout(() => {
        ApiService.updateConversationDescription(
          conversationId,
          JSON.stringify(currentMessages[0]?.response || currentMessages[0]),
          fetchConversations
        );
      }, 3000);

      router.push(`/c/${conversationId}`);

      return conversationId;
    } catch (err) {
      console.error("Failed to create conversation:", err);

      return conversationId;
    }
  };

  // const createNewConversation = async (
  //   initialMessages: MessageType[]
  // ): Promise<string> => {
  //   try {
  //     const convoID = crypto.randomUUID();
  //     await ApiService.createConversation(convoID);
  //     // await updateConversationState(
  //     //   convoID,
  //     //   initialMessages,
  //     //   `File Upload: ${initialMessages[0]?.response || ""}`
  //     // );

  //     setConvoMessages((prev) => {
  //       const baseMessages = replaceLastMessage ? prev.slice(0, -1) : prev;
  //       return [...baseMessages, ...newMessages];
  //     });

  //     router.push(`/try/c/${convoID}`);
  //     return convoID;
  //   } catch (error) {
  //     console.error("Failed to create conversation:", error);
  //     throw new Error("Failed to create new conversation");
  //   }
  // };

  const uploadFile = async (conversationId: string = ""): Promise<string> => {
    if (!file) throw new Error("No file selected");
    const formData = new FormData();

    formData.append("message", textContent);
    formData.append("file", file);
    formData.append("conversation_id", conversationId);

    try {
      const response = await apiauth.post(
        isImage ? "/image" : "/document/query",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log(response);

      return response.data.response.response;
    } catch (error) {
      console.error("File upload failed:", error);
      throw new Error("Failed to upload file");
    }
  };

  const handleSubmit = async () => {
    if (!isValid || loading || !file) return;
    setLoading(true);

    try {
      console.log(file);

      const bot_message_id = String(ObjectID());
      const user_message_id = String(ObjectID());

      const currentMessages: MessageType[] = [
        {
          type: "user",
          message_id: user_message_id,
          response: textContent,
          filename: file.name,
          date: fetchDate(),
        },
        {
          type: "bot",
          message_id: bot_message_id,
          response: "",
          date: fetchDate(),
          loading: true,
          filename: file.name,
          disclaimer: "Please wait. This may take a while.",
        },
      ];
      // setConvoMessages((prev) => [...prev, ...currentMessages]);

      setConvoMessages((oldMessages) => {
        return oldMessages && oldMessages?.length > 0
          ? [...oldMessages, ...currentMessages]
          : [...currentMessages];
      });

      const conversationId =
        convoIdParam || (await createNewConversation(currentMessages));

      closeModal();

      const botResponse = await uploadFile(conversationId);

      const finalBotMessage: MessageType = {
        type: "bot",
        message_id: bot_message_id,
        response: botResponse,
        date: fetchDate(),
        loading: false,
        filename: file.name,
        disclaimer:
          " Please try to be as specific as you can with your question when talking with documents!",
      };

      setConvoMessages((prev) => [...prev.slice(0, -1), finalBotMessage]);

      currentMessages[currentMessages.length - 1] = finalBotMessage;

      await ApiService.updateConversation(conversationId, currentMessages);

      // await updateConversationState(
      //   conversationId,
      //   [userMessage, finalBotMessage],
      //   undefined,
      //   true
      // );
    } catch (error) {
      toast.error("Uh oh! Something went wrong.", {
        classNames: {
          toast: "flex items-center p-3 rounded-xl gap-3 w-[350px] toast_error",
          title: "text-sm",
          description: "text-sm",
        },
        duration: 3000,
        description:
          "There was a problem with uploading your file. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        accept={isImage ? "image/png,image/jpeg" : "application/pdf"}
        id="fileInput"
        style={{ display: "none" }}
        type="file"
        onChange={handleFileSelect}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 text-white w-[400px] md:rounded-2xl rounded-2xl border-none">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div>
            {/* {fileLoading ? (
              <div className="h-[250px] w-[350px] bg-black bg-opacity-40 rounded-3xl flex justify-center items-center">
                <Spinner size="lg" color="primary" />
              </div>
            ) : isImage && file ? (
              <img
                src={URL.createObjectURL(file)}
                className="rounded-3xl my-2 object-cover h-[250px] w-[350px]"
                alt="Uploaded file preview"
              />
            ) : (
              <PdfContainer file={file} />
            )} */}

            {file && (
              <div className="bg-[#00bbff] rounded-xl p-3 text-black mb-2">
                <div className="flex items-center gap-3">
                  <FileIcon />
                  <div>
                    <div className="font-medium">
                      {file.name?.split(".")[0].slice(0, 25)}
                      {file.name?.length > 25 ? "... " : "."}
                      {file.name?.split(".")[1]}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Textarea
              isRequired
              className="dark mt-4"
              color="primary"
              isInvalid={!isValid}
              label={`What do you want to do with this ${
                isImage ? "image" : "file"
              }?`}
              labelPlacement="outside"
              maxRows={3}
              minRows={2}
              placeholder={`e.g., ${
                isImage ? "What is in this image?" : "Summarize this document"
              }`}
              size="lg"
              startContent={null}
              value={textContent}
              variant="faded"
              onKeyDown={(event) => {
                if (event.key === "Enter" && textContent.trim() !== "") {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              onValueChange={(value: string) => setTextContent(value)}
            />
          </div>
          <DialogFooter className="flex flex-row !justify-between w-full">
            <Button color="danger" variant="flat" onClick={closeModal}>
              Cancel
            </Button>

            <Button
              color="primary"
              disabled={!isValid || loading}
              isLoading={loading}
              onClick={handleSubmit}
            >
              {loading ? "Uploading" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
