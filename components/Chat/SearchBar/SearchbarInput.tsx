import React from "react";
import { Textarea } from "@heroui/input";
import SearchbarRightSendBtn from "./SearchbarRightSendBtn";
import SearchbarLeftDropdown from "./SearchbarLeftDropdown";

interface SearchbarInputProps {
  searchbarText: string;
  onSearchbarTextChange: (text: string) => void;
  handleFormSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  handleKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  currentHeight: number;
  onHeightChange: (height: number) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  loading: boolean;
}

const SearchbarInput: React.FC<SearchbarInputProps> = ({
  searchbarText,
  onSearchbarTextChange,
  handleFormSubmit,
  handleKeyDown,
  currentHeight,
  onHeightChange,
  inputRef,
  loading,
}) => {
  return (
    <form onSubmit={handleFormSubmit}>
      <Textarea
        ref={inputRef}
        autoFocus
        classNames={{
          inputWrapper: "p-[6px] data-[hover=true]:bg-zinc-900",
          innerWrapper: `${currentHeight > 24 ? "items-end" : "items-center"}`,
        }}
        disabled={loading}
        endContent={
          <SearchbarRightSendBtn
            handleFormSubmit={handleFormSubmit}
            loading={loading}
            searchbarText={searchbarText}
            setSearchbarText={onSearchbarTextChange}
          />
        }
        isInvalid={searchbarText.length > 10000}
        maxRows={13}
        minRows={1}
        placeholder="Ask gaia something..."
        radius="full"
        size="lg"
        startContent={<SearchbarLeftDropdown loading={loading} />}
        value={searchbarText}
        onHeightChange={onHeightChange}
        onKeyDown={handleKeyDown}
        onValueChange={onSearchbarTextChange}
      />
    </form>
  );
};

export default SearchbarInput;
