import React from "react";

import { SearchMode } from "@/types/shared";

import ComposerLeft from "./ComposerLeft";
import SearchbarRightSendBtn from "./ComposerRight";

interface SearchbarToolbarProps {
  selectedMode: Set<SearchMode>;
  openPageFetchModal: () => void;
  openGenerateImageModal: () => void;
  openFileUploadModal: () => void;
  handleFormSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  handleSelectionChange: (mode: SearchMode) => void;
}

const ComposerToolbar: React.FC<SearchbarToolbarProps> = ({
  selectedMode,
  openPageFetchModal,
  openGenerateImageModal,
  openFileUploadModal,
  handleFormSubmit,
  handleSelectionChange,
}) => {
  return (
    <div className="flex items-center justify-between px-2 pt-1">
      <div className="flex items-center justify-start gap-2">
        <ComposerLeft
          selectedMode={selectedMode}
          openPageFetchModal={openPageFetchModal}
          openGenerateImageModal={openGenerateImageModal}
          openFileUploadModal={openFileUploadModal}
          handleSelectionChange={handleSelectionChange}
        />
      </div>
      <SearchbarRightSendBtn handleFormSubmit={handleFormSubmit} />
    </div>
  );
};

export default ComposerToolbar;
