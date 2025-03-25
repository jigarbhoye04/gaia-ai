import React from "react";
import { SearchMode } from "./MainSearchbar";
import SearchbarLeftDropdown from "./SearchbarLeftDropdown";
import SearchbarRightSendBtn from "./SearchbarRightSendBtn";

interface SearchbarToolbarProps {
  selectedMode: Set<SearchMode>;
  openPageFetchModal: () => void;
  openGenerateImageModal: () => void;
  handleFormSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  handleSelectionChange: (mode: SearchMode) => void;
}

const SearchbarToolbar: React.FC<SearchbarToolbarProps> = ({
  selectedMode,
  openPageFetchModal,
  openGenerateImageModal,
  handleFormSubmit,
  handleSelectionChange,
}) => {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center justify-start gap-2">
        <SearchbarLeftDropdown
          selectedMode={selectedMode}
          openPageFetchModal={openPageFetchModal}
          openGenerateImageModal={openGenerateImageModal}
          handleSelectionChange={handleSelectionChange}
        />
      </div>
      <SearchbarRightSendBtn handleFormSubmit={handleFormSubmit} />
    </div>
  );
};

export default SearchbarToolbar;
