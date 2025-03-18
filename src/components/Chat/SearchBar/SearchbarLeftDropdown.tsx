import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { useEffect, useRef, useState } from "react";

import FileUpload from "../../Documents/FileUpload";
import {
  AiImageIcon,
  FileUploadIcon,
  ImageUploadIcon,
  PlusSignIcon,
} from "../../Misc/icons";
import GenerateImage from "../GenerateImage";

export default function SearchbarLeftDropdown({
  loading,
}: {
  loading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const [triggerClick, setTriggerClick] = useState(false);

  const chooseFile = () => {
    setIsImage(false);
    setTriggerClick(true);
  };

  const chooseImage = () => {
    setIsImage(true);
    setTriggerClick(true);
  };

  useEffect(() => {
    if (triggerClick) {
      if (!!fileInputRef.current) {
        fileInputRef.current?.click();
        setTriggerClick(false);
      }
    }
  }, [triggerClick]);

  return (
    <>
      <Dropdown
        showArrow
        backdrop="opaque"
        className={`w-full text-foreground dark ${
          loading ? "cursor-wait" : "cursor-pointer"
        }`}
        classNames={{
          base: "dark",
        }}
        closeOnSelect={true}
        isDisabled={loading}
        isDismissable={true}
        offset={0}
        placement="top"
        shouldCloseOnInteractOutside={() => true}
      >
        <DropdownTrigger>
          <div
            className={`${
              loading ? "cursor-wait" : "cursor-pointer"
            } group relative z-0 box-border inline-flex h-8 w-8 min-w-8 select-none appearance-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-zinc-900/50 px-0 text-small font-normal text-default-foreground subpixel-antialiased outline-none outline outline-2 outline-zinc-700 tap-highlight-transparent transition-transform-colors-opacity hover:!bg-default data-[focus-visible=true]:z-10 data-[pressed=true]:scale-[0.97] data-[focus-visible=true]:outline-1 data-[focus-visible=true]:outline-offset-2 data-[focus-visible=true]:outline-focus motion-reduce:transition-none`}
          >
            <PlusSignIcon width={20} height={20} />
          </div>
        </DropdownTrigger>

        <DropdownMenu variant="faded" aria-label="Static Actions">
          <DropdownItem
            key="image"
            className="w-full transition-all"
            onPress={chooseImage}
            isDisabled
          >
            <div className="flex items-center justify-between">
              Upload Image
              <ImageUploadIcon color="#00bbff" />
            </div>
          </DropdownItem>

          <DropdownItem
            key="pdf"
            className="darktransition-all w-full"
            onPress={chooseFile}
            isDisabled
          >
            <div className="flex items-center justify-between">
              Upload Document
              <FileUploadIcon color="#00bbff" />
            </div>
          </DropdownItem>

          <DropdownItem
            key="generate_image"
            className="w-full transition-all"
            onPress={() => setOpenImageDialog(true)}
          >
            <div className="flex items-center justify-between">
              Generate Image
              <AiImageIcon color="#00bbff" />
            </div>
          </DropdownItem>

          {/* <DropdownItem
            key="calendar"
            className="w-fit rounded-full dark hover:bg-zinc-800 transition-all"
          >
            <Calendar01Icon color="#00bbff" />
          </DropdownItem> */}
        </DropdownMenu>
      </Dropdown>

      <FileUpload fileInputRef={fileInputRef} isImage={isImage} />

      <GenerateImage
        openImageDialog={openImageDialog}
        setOpenImageDialog={setOpenImageDialog}
      />

      {/* <Button isIconOnly radius="full" variant="ghost">
        <InternetIcon />
      </Button> */}
    </>
  );
}
