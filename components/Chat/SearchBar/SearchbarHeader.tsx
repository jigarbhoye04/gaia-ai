import { GlobalSearchIcon } from "@/components/Misc/icons";
import { ArrowUpRight } from "lucide-react";
import React from "react";

interface SearchbarHeaderProps {
  enableSearch: boolean;
  toggleSearch: () => void;
  pageFetchURL: string;
  fetchPageModal: boolean;
  openPageFetchModal: () => void;
  searchbarText: string;
}

const SearchbarHeader: React.FC<SearchbarHeaderProps> = ({
  enableSearch,
  toggleSearch,
  pageFetchURL,
  fetchPageModal,
  openPageFetchModal,
  searchbarText,
}) => {
  return (
    <div className="flex items-center justify-between mb-[6px] gap-1">
      <button
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

      <div className="flex w-full justify-end text-sm mt-1 text-gray-500">
        {searchbarText.length}/10000 words
      </div>
    </div>
  );
};

export default SearchbarHeader;
