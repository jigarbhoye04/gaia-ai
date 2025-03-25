import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Check } from "lucide-react";
import React from "react";
import {
  FileUploadIcon,
  GlobalSearchIcon,
  Image02Icon,
  InternetIcon,
  PlusSignIcon,
} from "../../Misc/icons";
import { SearchMode } from "./MainSearchbar";
import { useLoading } from "@/hooks/useLoading";

interface SearchbarLeftDropdownProps {
  selectedMode: Set<SearchMode>;
  openPageFetchModal: () => void;
  openGenerateImageModal: () => void;
  handleSelectionChange: (mode: SearchMode) => void;
}

interface DropdownItemConfig {
  id: SearchMode;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
  isMode?: boolean;
}

export default function SearchbarLeftDropdown({
  selectedMode,
  openPageFetchModal,
  openGenerateImageModal,
  handleSelectionChange,
}: SearchbarLeftDropdownProps) {
  const { isLoading } = useLoading();

  const currentMode = React.useMemo(
    () => Array.from(selectedMode)[0],
    [selectedMode],
  );

  const dropdownItems: DropdownItemConfig[] = [
    {
      id: "deep_search",
      label: "Deep Search",
      icon: <GlobalSearchIcon className="h-5 w-5 text-primary" />,
      isMode: true,
    },
    {
      id: "web_search",
      label: "Web Search",
      icon: <InternetIcon className="h-5 w-5 text-primary" />,
      isMode: true,
    },
    {
      id: "fetch_webpage",
      label: "Fetch Webpage",
      icon: <ArrowUpRight className="h-5 w-5 text-primary" />,
      action: openPageFetchModal,
      isMode: false,
    },
    {
      id: "generate_image",
      label: "Generate Image",
      icon: <Image02Icon className="h-5 w-5 text-primary" />,
      action: openGenerateImageModal,
      isMode: false,
    },
    {
      id: "upload_file",
      label: "Upload File",
      icon: <FileUploadIcon className="h-5 w-5 text-primary" />,
      action: openGenerateImageModal,
      isMode: false,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "group relative h-8 w-8 rounded-full border-2 border-zinc-700 bg-zinc-900/50 p-0 hover:bg-zinc-800",
            isLoading && "cursor-wait",
          )}
          disabled={isLoading}
        >
          <PlusSignIcon width={20} height={20} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        className="w-[200px] rounded-xl border-none bg-zinc-900 p-1 text-white"
      >
        {dropdownItems.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => {
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
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-row items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <div>
                {currentMode === item.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
