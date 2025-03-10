import { GlobalSearchIcon } from "@/components/Misc/icons";
import { ArrowUpRight } from "lucide-react";
import React from "react";
import SearchbarLeftDropdown from "./SearchbarLeftDropdown";
import SearchbarRightSendBtn from "./SearchbarRightSendBtn";
import { Tooltip } from "@heroui/tooltip";

interface SearchbarToolbarProps {
  enableSearch: boolean;
  toggleSearch: () => void;
  pageFetchURL: string;
  fetchPageModal: boolean;
  openPageFetchModal: () => void;
  searchbarText: string;
  loading: boolean;
  onSearchbarTextChange: (text: string) => void;
  handleFormSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
}

const SearchbarToolbar: React.FC<SearchbarToolbarProps> = ({
  enableSearch,
  toggleSearch,
  pageFetchURL,
  fetchPageModal,
  openPageFetchModal,
  searchbarText,
  loading,
  handleFormSubmit,
  onSearchbarTextChange,
}) => {
  return (
    <div className="flex items-center justify-between mt-[5px] px-2">
      <div className="flex items-center justify-start gap-2">
        <SearchbarLeftDropdown loading={loading} />

        <Tooltip content="Search the Web">
          <button
            className={`flex w-fit gap-1 rounded-full px-3 h-8 text-sm items-center transition-all outline outline-2 ${
              enableSearch
                ? "bg-primary/15 text-primary hover:bg-[#113745] outline-primary/20"
                : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-700 outline-zinc-700"
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
            className={`flex w-fit gap-1 rounded-full px-3 h-8 text-sm items-center outline-2 outline transition-all ${
              pageFetchURL.length > 0 && !fetchPageModal
                ? "bg-primary/15 text-primary hover:bg-[#113745] outline-primary/20"
                : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-700 outline-zinc-700"
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
        searchbarText={searchbarText}
        setSearchbarText={onSearchbarTextChange}
      />
    </div>
  );
};

export default SearchbarToolbar;
