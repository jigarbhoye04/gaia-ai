import { useLoading } from "@/hooks/useLoading";
import { Textarea } from "@heroui/input";
import React from "react";

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
  const { isLoading } = useLoading();

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
        disabled={isLoading}
        isInvalid={searchbarText.length > 10000}
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
