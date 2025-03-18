import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input, Textarea } from "@heroui/input";
import { ArrowUpRight } from "lucide-react";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLoginModal, useLoginModalActions } from "@/hooks/useLoginModal";
import { RootState } from "@/redux/store";

import {
  AiImageIcon,
  FileUploadIcon,
  GlobalSearchIcon,
  ImageUploadIcon,
  PlusSignIcon,
  SentIcon,
} from "../../Misc/icons";

function DummyLeftDropdown() {
  return (
    <Dropdown
      showArrow
      backdrop="opaque"
      className="w-full text-foreground dark"
      classNames={{ base: "dark" }}
      closeOnSelect={true}
      isDismissable={true}
      offset={0}
      placement="top"
      shouldCloseOnInteractOutside={() => true}
    >
      <DropdownTrigger className="group relative z-0 mr-[2px] box-border inline-flex h-10 w-10 min-w-10 select-none appearance-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full border-medium border-default bg-zinc-900 px-0 text-small font-normal text-default-foreground subpixel-antialiased outline-none tap-highlight-transparent transition-transform-colors-opacity hover:!bg-default data-[focus-visible=true]:z-10 data-[pressed=true]:scale-[0.97] data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-offset-2 data-[focus-visible=true]:outline-focus motion-reduce:transition-none">
        <div>
          <PlusSignIcon />
        </div>
      </DropdownTrigger>

      <DropdownMenu aria-label="Static Actions" variant="faded">
        <DropdownItem key="image" className="w-full transition-all">
          <div className="flex items-center justify-between">
            Upload Image
            <ImageUploadIcon color="#00bbff" />
          </div>
        </DropdownItem>

        <DropdownItem key="pdf" className="w-full transition-all">
          <div className="flex items-center justify-between">
            Upload Document
            <FileUploadIcon color="#00bbff" />
          </div>
        </DropdownItem>

        <DropdownItem key="generate_image" className="w-full transition-all">
          <div className="flex items-center justify-between">
            Generate Image
            <AiImageIcon color="#00bbff" />
          </div>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

const DummySearchbar = () => {
  const { setLoginModalOpen } = useLoginModalActions();
  const [enableSearch, setEnableSearch] = useState(false);
  const [pageFetchURL, setPageFetchURL] = useState("");
  const [fetchPageModal, setFetchPageModal] = useState(false);

  const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setLoginModalOpen(false);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setLoginModalOpen(true);
    }
  };

  const toggleSearch = () => setEnableSearch((prev) => !prev);
  const openPageFetchModal = () => setFetchPageModal(true);

  function isValidURL(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <>
      <div className="searchbar gap-3 rounded-3xl bg-zinc-900 px-3 py-2">
        <div className="mb-[6px] flex items-center justify-start gap-1">
          <button
            aria-label="Dummy Search Button"
            className={`flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm transition-all ${
              enableSearch
                ? "bg-primary text-white hover:bg-[#00bbffAA]"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
            type="button"
            onClick={toggleSearch}
          >
            <span className="text-nowrap">Web Search</span>
            <GlobalSearchIcon
              color={enableSearch ? "#fff" : "#A1A1AA"}
              height={18}
              width={18}
            />
          </button>

          <button
            aria-label="Dummy Fetch Page Button"
            className={`flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm transition-all ${
              pageFetchURL.length > 0 && !fetchPageModal
                ? "bg-primary text-white hover:bg-[#00bbffAA]"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
            type="button"
            onClick={openPageFetchModal}
          >
            <span className="text-nowrap">Fetch Page</span>
            <ArrowUpRight
              color={
                pageFetchURL.length > 0 && !fetchPageModal ? "#fff" : "#A1A1AA"
              }
              height={18}
              width={18}
            />
          </button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <Textarea
            autoFocus
            classNames={{
              inputWrapper: "p-[6px] data-[hover=true]:bg-zinc-900",
              innerWrapper: "items-center",
            }}
            endContent={
              <Button
                isIconOnly
                aria-label="Send message"
                color="primary"
                radius="full"
                type="submit"
              >
                <SentIcon color="black" fill="#ffffff40" />
              </Button>
            }
            maxRows={13}
            minRows={1}
            placeholder="Ask gaia something..."
            radius="full"
            size="lg"
            startContent={<DummyLeftDropdown />}
            onKeyDown={handleKeyDown}
          />
        </form>
      </div>
      <Dialog open={fetchPageModal} onOpenChange={setFetchPageModal}>
        <DialogContent className="border-none bg-zinc-900 text-white dark">
          <DialogHeader>
            <DialogTitle>Fetch Page</DialogTitle>
            <DialogDescription>
              Enter a URL to fetch and analyze the webpage's content. GAIA will
              extract and process the text and relevant information to help
              understand the page's context.
            </DialogDescription>
          </DialogHeader>
          <Input
            errorMessage="Please enter a valid URL! (starting with https://)"
            isInvalid={!isValidURL(pageFetchURL) && pageFetchURL.length > 0}
            label="Enter URL"
            value={pageFetchURL}
            onKeyDown={(e) => {
              if (e.key === "Enter") setFetchPageModal(false);
            }}
            onValueChange={setPageFetchURL}
          />
          <DialogFooter>
            <Button
              color="danger"
              variant="flat"
              onPress={() => {
                setPageFetchURL("");
                setFetchPageModal(false);
              }}
            >
              Clear
            </Button>
            <Button
              color="primary"
              onPress={() => {
                if (isValidURL(pageFetchURL) && pageFetchURL.length > 0)
                  setFetchPageModal(false);
              }}
            >
              Fetch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DummySearchbar;
