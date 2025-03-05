import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input, Textarea } from "@heroui/input";
import { ArrowUpRight } from "lucide-react";
import React, { Dispatch, SetStateAction, useState } from "react";

import {
  AiImageIcon,
  FileUploadIcon,
  GlobalSearchIcon,
  ImageUploadIcon,
  PlusSignIcon,
  SentIcon,
} from "../Misc/icons";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function DummyLeftDropdown() {
  return (
    <Dropdown
      showArrow
      backdrop="opaque"
      className="dark text-foreground w-full"
      classNames={{ base: "dark" }}
      closeOnSelect={true}
      isDismissable={true}
      offset={0}
      placement="top"
      shouldCloseOnInteractOutside={() => true}
    >
      <DropdownTrigger className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent data-[pressed=true]:scale-[0.97] outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 border-medium bg-zinc-900 text-small gap-2 rounded-full px-0 transition-transform-colors-opacity motion-reduce:transition-none border-default text-default-foreground hover:!bg-default min-w-10 w-10 h-10 mr-[2px]">
        <div>
          <PlusSignIcon />
        </div>
      </DropdownTrigger>

      <DropdownMenu aria-label="Static Actions" variant="faded">
        <DropdownItem key="image" className="w-full transition-all">
          <div className="flex justify-between items-center">
            Upload Image
            <ImageUploadIcon color="#00bbff" />
          </div>
        </DropdownItem>

        <DropdownItem key="pdf" className="w-full transition-all">
          <div className="flex justify-between items-center">
            Upload Document
            <FileUploadIcon color="#00bbff" />
          </div>
        </DropdownItem>

        <DropdownItem key="generate_image" className="w-full transition-all">
          <div className="flex justify-between items-center">
            Generate Image
            <AiImageIcon color="#00bbff" />
          </div>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

const DummySearchbar = ({
  setLoginModalOpen,
}: {
  setLoginModalOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [enableSearch, setEnableSearch] = useState(false);
  const [pageFetchURL, setPageFetchURL] = useState("");
  const [fetchPageModal, setFetchPageModal] = useState(false);

  const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setLoginModalOpen(true);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event
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
      <div className="searchbar bg-zinc-900 px-3 py-2 rounded-3xl gap-3">
        <div className="flex items-center justify-start mb-[6px] gap-1">
          <button
            aria-label="Dummy Search Button"
            className={`flex w-fit gap-1 rounded-full px-3 py-1 text-sm items-center transition-all ${
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
            className={`flex w-fit gap-1 rounded-full px-3 py-1 text-sm items-center transition-all ${
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
        <DialogContent className="dark text-white bg-zinc-900 border-none">
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
