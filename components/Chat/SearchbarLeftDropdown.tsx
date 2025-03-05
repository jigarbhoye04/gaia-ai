import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { useEffect, useRef, useState } from "react";

import FileUpload from "../Documents/FileUpload";
import {
  AiImageIcon,
  FileUploadIcon,
  ImageUploadIcon,
  PlusSignIcon,
} from "../Misc/icons";

import GenerateImage from "./GenerateImage";

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
        className={`dark text-foreground w-full ${
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
            } z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent data-[pressed=true]:scale-[0.97] outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 border-medium bg-zinc-900 text-small gap-2 rounded-full px-0 transition-transform-colors-opacity motion-reduce:transition-none border-default text-default-foreground hover:!bg-default min-w-10 w-10 h-10 mr-[2px]`}
          >
            <PlusSignIcon />
          </div>
        </DropdownTrigger>

        <DropdownMenu
          variant="faded"
          aria-label="Static Actions"
          // itemClasses={{
          //   content: "w-full",
          // }}
        >
          <DropdownItem
            key="image"
            className="w-full transition-all"
            onPress={chooseImage}
          >
            <div className="flex justify-between items-center">
              Upload Image
              <ImageUploadIcon color="#00bbff" />
            </div>
          </DropdownItem>

          <DropdownItem
            key="pdf"
            className="w-full darktransition-all"
            onPress={chooseFile}
            isDisabled
          >
            <div className="flex justify-between items-center">
              Upload Document
              <FileUploadIcon color="#00bbff" />
            </div>
          </DropdownItem>

          <DropdownItem
            key="generate_image"
            className="w-full transition-all"
            onPress={() => setOpenImageDialog(true)}
          >
            <div className="flex justify-between items-center">
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
