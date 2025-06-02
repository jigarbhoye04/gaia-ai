import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Plus, X } from "lucide-react";
import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { SearchMode } from "@/types/shared";

interface FetchPageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageFetchURLs: string[];
  onPageFetchURLsChange: (urls: string[]) => void;
  handleSelectionChange: (mode: SearchMode) => void;
}

const FetchPageModal: React.FC<FetchPageModalProps> = ({
  open,
  onOpenChange,
  pageFetchURLs,
  onPageFetchURLsChange,
  handleSelectionChange,
}) => {
  const [currentURL, setCurrentURL] = useState("");
  const [isCurrentURLValid, setIsCurrentURLValid] = useState(false);

  const validateURL = (url: string) => {
    if (!url || url.trim() === "") {
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch (err) {
      console.error("Invalid URL:", err);
      return false;
    }
  };

  useEffect(() => {
    setIsCurrentURLValid(validateURL(currentURL));
  }, [currentURL]);

  const addURL = () => {
    if (isCurrentURLValid && !pageFetchURLs.includes(currentURL)) {
      onPageFetchURLsChange([...pageFetchURLs, currentURL]);
      setCurrentURL("");
    }
  };

  const removeURL = (urlToRemove: string) => {
    onPageFetchURLsChange(pageFetchURLs.filter((url) => url !== urlToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-none bg-zinc-900">
        <DialogHeader>
          <DialogTitle>Fetch Webpage Content</DialogTitle>
          <DialogDescription>
            Enter the URLs of the webpages you want to fetch content from
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <div className="flex items-end gap-2">
                <Input
                  label="URL to fetch"
                  labelPlacement="outside"
                  id="url"
                  variant="faded"
                  type="url"
                  placeholder="https://example.com"
                  value={currentURL}
                  onChange={(e) => setCurrentURL(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addURL();
                    }
                  }}
                  autoFocus
                  isInvalid={currentURL.length > 0 && !isCurrentURLValid}
                  errorMessage={
                    currentURL.length > 0 && !isCurrentURLValid
                      ? "Please enter a valid URL (starting with https://)"
                      : ""
                  }
                />
                <Button
                  isIconOnly
                  color="primary"
                  onPress={addURL}
                  isDisabled={
                    !isCurrentURLValid || pageFetchURLs.includes(currentURL)
                  }
                >
                  <Plus />
                </Button>
              </div>
            </div>

            {pageFetchURLs.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="text-sm text-zinc-400">Added URLs:</div>
                {pageFetchURLs.map((url, index) => (
                  <div
                    key={index}
                    className="flex w-fit items-center gap-2 rounded-full bg-zinc-700 pl-5 text-sm"
                  >
                    <span className="truncate">{url}</span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => removeURL(url)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="flat"
              onPress={() => {
                onPageFetchURLsChange([]);
                setCurrentURL("");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              isDisabled={pageFetchURLs.length === 0}
              color="primary"
              onPress={() => {
                handleSelectionChange("fetch_webpage");
                onOpenChange(false);
              }}
            >
              Fetch Content
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FetchPageModal;
