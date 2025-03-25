import { AlertCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { SearchMode } from "./MainSearchbar";

interface FetchPageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageFetchURL: string;
  onPageFetchURLChange: (url: string) => void;
  handleSelectionChange: (mode: SearchMode) => void;
}

const FetchPageModal: React.FC<FetchPageModalProps> = ({
  open,
  onOpenChange,
  pageFetchURL,
  onPageFetchURLChange,
  handleSelectionChange,
}) => {
  const [isValidURL, setIsValidURL] = useState(false);

  // Validate URL whenever pageFetchURL changes
  useEffect(() => {
    const validateURL = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch (err) {
        return false;
      }
    };

    setIsValidURL(validateURL(pageFetchURL));
  }, [pageFetchURL]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-none bg-zinc-900">
        <DialogHeader>
          <DialogTitle>Fetch Webpage Content</DialogTitle>
          <DialogDescription>
            Enter the URL of the webpage you want to fetch content from
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Input
                label="URL to fetch"
                id="url"
                variant="faded"
                type="url"
                placeholder="https://example.com"
                value={pageFetchURL}
                onChange={(e) => onPageFetchURLChange(e.target.value)}
                autoFocus
                isInvalid={pageFetchURL.length > 0 && !isValidURL}
                errorMessage={
                  pageFetchURL.length > 0 && !isValidURL
                    ? "Please enter a valid URL (starting with https://)"
                    : ""
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="flat"
              onPress={() => {
                onPageFetchURLChange("");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              isDisabled={!pageFetchURL || !isValidURL}
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
