import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { toast } from "sonner";

interface FetchPageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageFetchURL: string;
  onPageFetchURLChange: (url: string) => void;
}

const FetchPageModal: React.FC<FetchPageModalProps> = ({
  open,
  onOpenChange,
  pageFetchURL,
  onPageFetchURLChange,
}) => {
  const isValidURL = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-none bg-zinc-900 text-white dark">
        <DialogHeader>
          <DialogTitle>Fetch Page</DialogTitle>
          <DialogDescription>
            Enter a URL to fetch and analyze the webpage's content. GAIA will
            extract and process the text and relevant information to help
            understand the page's context.
          </DialogDescription>
        </DialogHeader>

        <Input
          errorMessage="Please enter a valid URL! (starting with https://)"
          isInvalid={!isValidURL(pageFetchURL) && pageFetchURL.length > 0}
          label="Enter URL"
          value={pageFetchURL}
          onKeyPress={(e) => {
            if (e.key === "Enter") onOpenChange(false);
          }}
          onValueChange={onPageFetchURLChange}
        />
        <DialogFooter>
          <Button
            color="danger"
            variant="flat"
            onPress={() => {
              onPageFetchURLChange("");
              onOpenChange(false);
            }}
          >
            Clear
          </Button>
          <Button
            color="primary"
            onPress={() => {
              if (isValidURL(pageFetchURL) && pageFetchURL.length > 0) {
                onOpenChange(false);
              } else {
                toast.error("Please enter a valid URL!");
              }
            }}
          >
            Fetch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FetchPageModal;
