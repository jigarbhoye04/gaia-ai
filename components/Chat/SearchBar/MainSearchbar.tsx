import React, { useState } from "react";
import { Button } from "@heroui/button";
import { ArrowDown } from "lucide-react";
import { useParams } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";
import { useConversation } from "@/hooks/useConversation";
import { toast } from "sonner";
import SearchbarHeader from "./SearchbarHeader";
import SearchbarInput from "./SearchbarInput";
import FetchPageModal from "./FetchPageModal";

interface MainSearchbarProps {
  scrollToBottom: () => void;
  isAtBottom: boolean;
  isOverflowing: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

const MainSearchbar: React.FC<MainSearchbarProps> = ({
  scrollToBottom,
  isAtBottom,
  isOverflowing,
  inputRef,
}) => {
  const { convoIdParam } = useParams();
  const [currentHeight, setCurrentHeight] = useState<number>(24);
  const [searchbarText, setSearchbarText] = useState<string>("");
  const [enableSearch, setEnableSearch] = useState<boolean>(false);
  const [pageFetchURL, setPageFetchURL] = useState<string>("");
  const [fetchPageModal, setFetchPageModal] = useState<boolean>(false);
  const { loading, updateConversation } = useConversation(convoIdParam ?? null);
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
    updateConversation(searchbarText, enableSearch, pageFetchURL);
    setSearchbarText("");
    inputRef.current?.focus();
    scrollToBottom();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event
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
        <div
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
        </div>

        <div className="searchbar bg-zinc-900 px-3 py-2 rounded-3xl gap-3">
          <SearchbarHeader
            enableSearch={enableSearch}
            toggleSearch={toggleSearch}
            pageFetchURL={pageFetchURL}
            fetchPageModal={fetchPageModal}
            openPageFetchModal={openPageFetchModal}
            searchbarText={searchbarText}
          />
          <SearchbarInput
            searchbarText={searchbarText}
            onSearchbarTextChange={setSearchbarText}
            handleFormSubmit={handleFormSubmit}
            handleKeyDown={handleKeyDown}
            currentHeight={currentHeight}
            onHeightChange={setCurrentHeight}
            inputRef={inputRef}
            loading={loading && isLoading}
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
