import { Textarea } from "@heroui/input";
import React from "react";

import { useLoading } from "@/hooks/useLoading";

interface SearchbarInputProps {
  searchbarText: string;
  onSearchbarTextChange: (text: string) => void;
  handleFormSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  handleKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  currentHeight: number;
  onHeightChange: (height: number) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

const SearchbarInput: React.FC<SearchbarInputProps> = ({
  searchbarText,
  onSearchbarTextChange,
  handleFormSubmit,
  handleKeyDown,
  currentHeight,
  onHeightChange,
  inputRef,
}) => {
  return (
    <form onSubmit={handleFormSubmit}>
      <Textarea
        ref={inputRef}
        autoFocus
        classNames={{
          inputWrapper:
            " px-3 data-[hover=true]:bg-zinc-800 group-data-[focus-visible=true]:ring-zinc-800 group-data-[focus-visible=true]:ring-offset-0",
          innerWrapper: `${currentHeight > 24 ? "items-end" : "items-center"}`,
        }}
        isInvalid={searchbarText.length > 10_000}
        maxRows={13}
        minRows={1}
        placeholder="Ask gaia something..."
        size="lg"
        value={searchbarText}
        onHeightChange={onHeightChange}
        onKeyDown={handleKeyDown}
        onValueChange={onSearchbarTextChange}
      />
    </form>
  );
};

export default SearchbarInput;
