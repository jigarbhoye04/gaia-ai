import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useLoading } from "@/hooks/useLoading";
import { useSendMessage } from "@/hooks/useSendMessage";
import FetchPageModal from "./FetchPageModal";
import SearchbarInput from "./SearchbarInput";
import SearchbarToolbar from "./SearchbarToolbar";
import GenerateImage from "../GenerateImage";
import FileUpload from "../FileUpload";
import FilePreview, { UploadedFilePreview } from "./FilePreview";

interface MainSearchbarProps {
  scrollToBottom: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export type SearchMode =
  | "deep_search"
  | "web_search"
  | "fetch_webpage"
  | "generate_image"
  | "upload_file"
  | null;

const MainSearchbar: React.FC<MainSearchbarProps> = ({
  scrollToBottom,
  inputRef,
}) => {
  const { id: convoIdParam } = useParams<{ id: string }>();
  const [currentHeight, setCurrentHeight] = useState<number>(24);
  const [searchbarText, setSearchbarText] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<Set<SearchMode>>(
    new Set([null]),
  );
  const [pageFetchURLs, setPageFetchURLs] = useState<string[]>([]);
  const [fetchPageModal, setFetchPageModal] = useState<boolean>(false);
  const [generateImageModal, setGenerateImageModal] = useState<boolean>(false);
  const [fileUploadModal, setFileUploadModal] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilePreview[]>([]);
  const sendMessage = useSendMessage(convoIdParam ?? null);
  const { setIsLoading } = useLoading();

  const currentMode = useMemo(
    () => Array.from(selectedMode)[0],
    [selectedMode],
  );

  const isValidURL = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    if (
      currentMode === "fetch_webpage" &&
      (!pageFetchURLs.length || !pageFetchURLs.every(isValidURL))
    ) {
      toast.error("Please enter valid URLs to fetch webpage content");
      return;
    }

    // Only prevent submission if there's no text AND no files
    if (
      !searchbarText &&
      currentMode !== "fetch_webpage" &&
      uploadedFiles.length === 0
    ) {
      return;
    }

    setIsLoading(true);

    // Get file IDs from the uploaded files
    const fileIds = uploadedFiles.map((file) => file.id);

    // Send the message with file IDs
    sendMessage(
      searchbarText,
      currentMode,
      currentMode === "fetch_webpage" ? pageFetchURLs : [],
      fileIds,
    );

    // Clear input and uploaded files after sending
    setSearchbarText("");
    setUploadedFiles([]);

    if (inputRef) inputRef.current?.focus();
    scrollToBottom();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      setSearchbarText((text) => `${text}\n`);
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleFormSubmit();
    }
  };

  const openPageFetchModal = () => {
    setFetchPageModal(true);
  };

  const openGenerateImageModal = () => {
    setGenerateImageModal(true);
  };

  const openFileUploadModal = () => {
    setFileUploadModal(true);
  };

  const handleSelectionChange = (mode: SearchMode) => {
    if (currentMode === mode) setSelectedMode(new Set([null]));
    else setSelectedMode(new Set([mode]));

    // If the user selects upload_file mode, open the file selector immediately
    if (mode === "upload_file") {
      setTimeout(() => {
        openFileUploadModal();
      }, 100);
    }
  };

  const handleFilesUploaded = (files: UploadedFilePreview[]) => {
    if (files.length === 0) {
      // If no files, just clear the uploaded files
      setUploadedFiles([]);
      return;
    }

    // Check if these are temporary files (with loading state) or final uploaded files
    const tempFiles = files.some((file) => file.isUploading);

    if (tempFiles) {
      // These are temporary files with loading state, just set them
      setUploadedFiles(files);
    } else {
      // These are the final uploaded files, replace temp files with final versions
      setUploadedFiles((prev) => {
        // Map through the previous files
        const updatedFiles = prev.map((prevFile) => {
          // Find the corresponding final file (if any)
          const finalFile = files.find((f) => f.tempId === prevFile.id);

          // If found, return the final file, otherwise keep the previous file
          return finalFile || prevFile;
        });

        return updatedFiles;
      });
    }
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== fileId),
    );
  };

  // Handle paste event for images
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          // Open the file upload modal with the pasted image
          setFileUploadModal(true);
          // We need to wait for the modal to open before we can access its DOM
          setTimeout(() => {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            const event = new Event("change", { bubbles: true });
            const fileInput = document.querySelector(
              'input[type="file"]',
            ) as HTMLInputElement;

            if (fileInput) {
              fileInput.files = dataTransfer.files;
              fileInput.dispatchEvent(event);
            }
          }, 100);
          break;
        }
      }
    }
  };

  // Add paste event listener for images
  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  return (
    <>
      <div className="searchbar_container relative">
        <div className="searchbar rounded-3xl bg-zinc-800 px-1 pb-2 pt-1">
          <FilePreview files={uploadedFiles} onRemove={removeUploadedFile} />
          <SearchbarInput
            searchbarText={searchbarText}
            onSearchbarTextChange={setSearchbarText}
            handleFormSubmit={handleFormSubmit}
            handleKeyDown={handleKeyDown}
            currentHeight={currentHeight}
            onHeightChange={setCurrentHeight}
            inputRef={inputRef}
            loading={false}
          />
          <SearchbarToolbar
            selectedMode={selectedMode}
            openPageFetchModal={openPageFetchModal}
            openGenerateImageModal={openGenerateImageModal}
            openFileUploadModal={openFileUploadModal}
            handleFormSubmit={handleFormSubmit}
            handleSelectionChange={handleSelectionChange}
          />
        </div>
      </div>
      <FetchPageModal
        open={fetchPageModal}
        onOpenChange={setFetchPageModal}
        pageFetchURLs={pageFetchURLs}
        onPageFetchURLsChange={setPageFetchURLs}
        handleSelectionChange={handleSelectionChange}
      />
      <GenerateImage
        openImageDialog={generateImageModal}
        setOpenImageDialog={setGenerateImageModal}
      />
      <FileUpload
        open={fileUploadModal}
        onOpenChange={setFileUploadModal}
        onFilesUploaded={handleFilesUploaded}
      />
    </>
  );
};

export default MainSearchbar;
