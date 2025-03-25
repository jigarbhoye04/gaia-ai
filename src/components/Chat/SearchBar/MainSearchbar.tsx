import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLoading } from "@/hooks/useLoading";
import { useSendMessage } from "@/hooks/useSendMessage";
import FetchPageModal from "./FetchPageModal";
import SearchbarInput from "./SearchbarInput";
import SearchbarToolbar from "./SearchbarToolbar";
import GenerateImage from "../GenerateImage";

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
  const [pageFetchURL, setPageFetchURL] = useState<string>("");
  const [fetchPageModal, setFetchPageModal] = useState<boolean>(false);
  const [generateImageModal, setGenerateImageModal] = useState<boolean>(false);
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

    if (currentMode === "fetch_webpage" && !isValidURL(pageFetchURL)) {
      toast.error("Please enter a valid URL to fetch webpage content");
      return;
    }

    if (!searchbarText && currentMode !== "fetch_webpage") return;

    setIsLoading(true);
    sendMessage(
      searchbarText,
      currentMode === "web_search",
      currentMode === "fetch_webpage" ? pageFetchURL : "",
    );
    setSearchbarText("");
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

  const handleSelectionChange = (mode: SearchMode) => {
    if (currentMode === mode) setSelectedMode(new Set([null]));
    else setSelectedMode(new Set([mode]));
  };

  useEffect(() => {
    console.log(selectedMode);
  }, [selectedMode]);

  return (
    <>
      <div className="searchbar_container relative">
        <div className="searchbar rounded-3xl bg-zinc-800 px-1 pb-2 pt-1">
          <SearchbarInput
            searchbarText={searchbarText}
            onSearchbarTextChange={setSearchbarText}
            handleFormSubmit={handleFormSubmit}
            handleKeyDown={handleKeyDown}
            currentHeight={currentHeight}
            onHeightChange={setCurrentHeight}
            inputRef={inputRef}
          />
          <SearchbarToolbar
            selectedMode={selectedMode}
            openPageFetchModal={openPageFetchModal}
            openGenerateImageModal={openGenerateImageModal}
            handleFormSubmit={handleFormSubmit}
            handleSelectionChange={handleSelectionChange}
          />
        </div>
      </div>
      <FetchPageModal
        open={fetchPageModal}
        onOpenChange={setFetchPageModal}
        pageFetchURL={pageFetchURL}
        onPageFetchURLChange={setPageFetchURL}
        handleSelectionChange={handleSelectionChange}
      />
      <GenerateImage
        openImageDialog={generateImageModal}
        setOpenImageDialog={setGenerateImageModal}
      />
    </>
  );
};

export default MainSearchbar;
