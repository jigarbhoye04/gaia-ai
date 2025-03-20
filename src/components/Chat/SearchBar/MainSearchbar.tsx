import { useParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { useLoading } from "@/hooks/useLoading";
import { useSendMessage } from "@/hooks/useSendMessage";

import FetchPageModal from "./FetchPageModal";
import SearchbarInput from "./SearchbarInput";
import SearchbarToolbar from "./SearchbarToolbar";

interface MainSearchbarProps {
  scrollToBottom: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  // isAtBottom?: boolean;
  // isOverflowing?: boolean;
}

const MainSearchbar: React.FC<MainSearchbarProps> = ({
  scrollToBottom,
  inputRef,
  // isAtBottom = true,
  // isOverflowing = false,
}) => {
  const { id: convoIdParam } = useParams<{ id: string }>();
  const [currentHeight, setCurrentHeight] = useState<number>(24);
  const [searchbarText, setSearchbarText] = useState<string>("");
  const [enableSearch, setEnableSearch] = useState<boolean>(false);
  const [pageFetchURL, setPageFetchURL] = useState<string>("");
  const [fetchPageModal, setFetchPageModal] = useState<boolean>(false);
  const sendMessage = useSendMessage(convoIdParam ?? null);
  const { isLoading, setIsLoading } = useLoading();

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
    if (!searchbarText && !isValidURL(pageFetchURL)) return;

    setIsLoading(true);
    sendMessage(searchbarText, enableSearch, pageFetchURL);
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

  const toggleSearch = () => {
    if (pageFetchURL.length > 0) {
      toast.error("Please disable page fetching before enabling web search.");
      return;
    }
    setEnableSearch((prev) => !prev);
  };

  const openPageFetchModal = () => {
    if (enableSearch) {
      toast.error("Please disable web search before fetching a page.");
      return;
    }
    setFetchPageModal(true);
  };

  return (
    <>
      <div className="searchbar_container relative">
        {/* <div
          className={`absolute top-[-55px] flex justify-center w-full pointer-events-none transition-opacity ${
            isOverflowing && !isAtBottom ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            isIconOnly
            className="pointer-events-auto"
            radius="full"
            size="sm"
            onPress={scrollToBottom}
          >
            <ArrowDown width={18} />
          </Button>
        </div> */}

        <div className="searchbar rounded-3xl bg-zinc-800 px-1 pb-2 pt-1">
          <SearchbarInput
            searchbarText={searchbarText}
            onSearchbarTextChange={setSearchbarText}
            handleFormSubmit={handleFormSubmit}
            handleKeyDown={handleKeyDown}
            currentHeight={currentHeight}
            onHeightChange={setCurrentHeight}
            inputRef={inputRef}
            loading={isLoading}
          />
          <SearchbarToolbar
            enableSearch={enableSearch}
            toggleSearch={toggleSearch}
            pageFetchURL={pageFetchURL}
            fetchPageModal={fetchPageModal}
            openPageFetchModal={openPageFetchModal}
            loading={isLoading}
            handleFormSubmit={handleFormSubmit}
          />
        </div>
      </div>
      <FetchPageModal
        open={fetchPageModal}
        onOpenChange={setFetchPageModal}
        pageFetchURL={pageFetchURL}
        onPageFetchURLChange={setPageFetchURL}
      />
    </>
  );
};

export default MainSearchbar;
