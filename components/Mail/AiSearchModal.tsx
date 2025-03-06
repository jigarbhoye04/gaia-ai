import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@heroui/input";
import { Button } from "@heroui/react";
import { Spinner } from "@heroui/spinner";
import React, { useState } from "react";
import { AiSearch02Icon } from "../Misc/icons";
import { EmailChip, EmailSuggestion } from "./EmailChip";

export interface AiSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selectedSuggestions: EmailSuggestion[]) => void;
}

export const AiSearchModal: React.FC<AiSearchModalProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EmailSuggestion[]>([]);
  const [selected, setSelected] = useState<EmailSuggestion[]>([]);

  const simulateApiRequest = (
    searchQuery: string
  ): Promise<EmailSuggestion[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: "1", email: "john@example.com", name: "John Doe" },
          { id: "2", email: "jane@example.com", name: "Jane Smith" },
          { id: "3", email: "bob@example.com", name: "Bob Johnson" },
        ]);
      }, 1500);
    });
  };

  const handleSearch = async () => {
    setLoading(true);
    const res = await simulateApiRequest(query);
    setResults(res);
    setLoading(false);
  };

  const toggleSelection = (suggestion: EmailSuggestion) => {
    if (selected.find((s) => s.id === suggestion.id)) {
      setSelected(selected.filter((s) => s.id !== suggestion.id));
    } else {
      setSelected([...selected, suggestion]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onOpenChange(false);
    setQuery("");
    setResults([]);
    setSelected([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-none outline-none">
        <DialogHeader>
          <DialogTitle>Search the Internet for Email?</DialogTitle>
          <DialogDescription>
            Enter a search term to find email suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            placeholder="Enter search term"
            value={query}
            variant="faded"
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            onPress={handleSearch}
            disabled={loading || !query}
            color="primary"
          >
            {loading ? (
              <Spinner size="sm" color="default" />
            ) : (
              <div className="flex items-center gap-1">
                Search
                <AiSearch02Icon width={19} />
              </div>
            )}
          </Button>
        </div>
        {results && results.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {results.map((suggestion) => (
              <EmailChip
                key={suggestion.id}
                suggestion={suggestion}
                selected={!!selected.find((s) => s.id === suggestion.id)}
                onToggle={toggleSelection}
              />
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            color="danger"
            variant="light"
            onPress={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleConfirm}
            disabled={selected.length === 0}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
