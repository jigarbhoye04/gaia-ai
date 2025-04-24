import { Tooltip } from "@heroui/tooltip";
import { ArrowUpRight, Check } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLoading } from "@/hooks/useLoading";
import { useLoadingText } from "@/hooks/useLoadingText";
import { cn } from "@/lib/utils";

import {
  AiWebBrowsingIcon,
  AttachmentIcon,
  GlobalSearchIcon,
  Image02Icon,
  PlusSignIcon,
} from "../../Misc/icons";
import { SearchMode } from "./MainSearchbar";

interface SearchbarLeftDropdownProps {
  selectedMode: Set<SearchMode>;
  openPageFetchModal: () => void;
  openGenerateImageModal: () => void;
  openFileUploadModal: () => void;
  handleSelectionChange: (mode: SearchMode) => void;
}

interface DropdownItemConfig {
  id: SearchMode;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
  isMode?: boolean;
  loadingText?: string;
  description?: string;
}

export default function SearchbarLeftDropdown({
  selectedMode,
  openPageFetchModal,
  openGenerateImageModal,
  openFileUploadModal,
  handleSelectionChange,
}: SearchbarLeftDropdownProps) {
  const { isLoading } = useLoading();
  const { setLoadingText } = useLoadingText();

  const currentMode = React.useMemo(
    () => Array.from(selectedMode)[0],
    [selectedMode],
  );

  const dropdownItems: DropdownItemConfig[] = [
    {
      id: "deep_search",
      label: "Deep Search",
      icon: (
        <AiWebBrowsingIcon className="min-h-[20px] min-w-[20px] text-primary" />
      ),
      isMode: true,
      loadingText: "Performing Deep Search...",
      // description: "Search multiple sources for comprehensive results",
      description:
        "Search the web and fetch content from those pages, extracting key information",
    },
    {
      id: "web_search",
      label: "Web Search",
      icon: (
        <GlobalSearchIcon className="min-h-[20px] min-w-[20px] text-primary" />
      ),
      isMode: true,
      loadingText: "Performing Web Search...",
      description: "Search the web for the latest information",
    },
    {
      id: "fetch_webpage",
      label: "Fetch Webpage",
      icon: <ArrowUpRight className="min-h-[20px] min-w-[20px] text-primary" />,
      action: openPageFetchModal,
      isMode: false,
      loadingText: "Fetching Webpage(s)...",
      description: "Retrieve and understand content from specific webpages",
    },
    {
      id: "generate_image",
      label: "Generate Image",
      icon: <Image02Icon className="min-h-[20px] min-w-[20px] text-primary" />,
      action: openGenerateImageModal,
      isMode: false,
      loadingText: "Generating Image...",
      description: "Create AI-generated images from text",
    },
    {
      id: "upload_file",
      label: "Attach Files",
      icon: (
        <AttachmentIcon className="min-h-[20px] min-w-[20px] text-primary" />
      ),
      action: openFileUploadModal,
      isMode: false,
      loadingText: "Uploading File(s)...",
      description: "Upload and analyze documents, images or other files",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "group relative h-10 w-10 rounded-full border-2 border-zinc-700 bg-zinc-900/50 p-0 hover:bg-zinc-800",
            isLoading && "cursor-wait",
          )}
          disabled={isLoading}
        >
          <PlusSignIcon className="min-h-[20px] min-w-[20px]" />
          <span
            className={`absolute -top-0 -right-0 h-2 w-2 rounded-full bg-primary transition ${currentMode ? "opacity-100" : "opacity-0"}`}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        className="w-fit gap-2 rounded-xl border-none bg-zinc-900 p-1 text-white"
      >
        {dropdownItems.map((item) => (
          <Tooltip
            content={<div className="max-w-[270px]">{item.description}</div>}
            key={item.id}
            color="foreground"
            radius="sm"
          >
            <DropdownMenuItem
              key={item.id}
              onClick={() => {
                setLoadingText(item.loadingText ?? "");
                if (item.isMode) handleSelectionChange(item.id as SearchMode);
                else if (item.action) item.action();
              }}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2",
                currentMode === item.id
                  ? "bg-[#00bbff50] text-primary focus:bg-[#00bbff50] focus:text-primary"
                  : "focus:bg-zinc-800 focus:text-white",
              )}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex flex-row items-center gap-2">
                    {item.icon}
                    <span className="">{item.label}</span>
                  </div>
                </div>
                <div>
                  {currentMode === item.id && (
                    <Check className="min-h-[20px] min-w-[20px] text-primary" />
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          </Tooltip>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
