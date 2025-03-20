import { Tooltip } from "@heroui/tooltip";
import { ArrowUpRight } from "lucide-react";
import React from "react";

import { GlobalSearchIcon } from "@/components/Misc/icons";

import SearchbarLeftDropdown from "./SearchbarLeftDropdown";
import SearchbarRightSendBtn from "./SearchbarRightSendBtn";

interface SearchbarToolbarProps {
  enableSearch: boolean;
  toggleSearch: () => void;
  pageFetchURL: string;
  fetchPageModal: boolean;
  openPageFetchModal: () => void;
  loading: boolean;
  handleFormSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
}

const SearchbarToolbar: React.FC<SearchbarToolbarProps> = ({
  enableSearch,
  toggleSearch,
  pageFetchURL,
  fetchPageModal,
  openPageFetchModal,
  loading,
  handleFormSubmit,
}) => {
  return (
    <div className="mt-[5px] flex items-center justify-between px-2">
      <div className="flex items-center justify-start gap-2">
        <SearchbarLeftDropdown loading={loading} />

        <Tooltip content="Search the Web">
          <button
            className={`flex h-8 w-fit items-center gap-1 rounded-full px-3 text-sm outline outline-2 transition-all ${
              enableSearch
                ? "bg-primary/15 text-primary outline-primary/20 hover:bg-[#113745]"
                : "bg-zinc-900/50 text-zinc-400 outline-zinc-700 hover:bg-zinc-700"
            }`}
            type="button"
            onClick={toggleSearch}
          >
            <span className="text-nowrap">Search</span>
            <GlobalSearchIcon
              color={enableSearch ? "#00bbff" : "#A1A1AA"}
              height={18}
              width={18}
            />
          </button>
        </Tooltip>

        <Tooltip content="Fetch content from a webpage">
          <button
            className={`flex h-8 w-fit items-center gap-1 rounded-full px-3 text-sm outline outline-2 transition-all ${
              pageFetchURL.length > 0 && !fetchPageModal
                ? "bg-primary/15 text-primary outline-primary/20 hover:bg-[#113745]"
                : "bg-zinc-900/50 text-zinc-400 outline-zinc-700 hover:bg-zinc-700"
            }`}
            type="button"
            onClick={openPageFetchModal}
          >
            <span className="text-nowrap">Fetch Page</span>
            <ArrowUpRight
              color={
                pageFetchURL.length > 0 && !fetchPageModal
                  ? "#00bbff"
                  : "#A1A1AA"
              }
              height={18}
              width={18}
            />
          </button>
        </Tooltip>
      </div>

      {/* 
      <div className="flex w-full justify-end text-sm mt-1 text-gray-500">
        {searchbarText.length}/10000 words
      </div> */}

      <SearchbarRightSendBtn
        handleFormSubmit={handleFormSubmit}
        loading={loading}
      />
    </div>
  );
};

export default SearchbarToolbar;
