"use client";

import { Chip } from "@heroui/chip";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Lightbulb } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { apiauth } from "@/utils/apiaxios";
import { usePathname, useRouter } from "next/navigation";
import {
  BubbleChatIcon,
  BubbleConversationChatIcon,
  Calendar01Icon,
  DiscoverCircleIcon,
  PencilEdit02Icon,
  PinIcon,
  Route02Icon,
  StickyNote01Icon,
  Tick02Icon,
} from "../Misc/icons";
import { SearchCard } from "./SearchCard";

const pages = [
  {
    path: "/explore",
    icon: (
      <DiscoverCircleIcon
        className="min-h-[22px] min-w-[22px]"
        color="#9b9b9b"
      />
    ),
    name: "Go to Explore",
  },
  {
    path: "/pins",
    icon: <PinIcon className="min-h-[22px] min-w-[22px]" color="#9b9b9b" />,
    name: "Go to Pins",
  },
  {
    path: "/calendar",
    icon: (
      <Calendar01Icon className="min-h-[22px] min-w-[22px]" color="#9b9b9b" />
    ),
    name: "Go to Calendar",
  },
  {
    path: "/notes",
    icon: (
      <StickyNote01Icon className="min-h-[22px] min-w-[22px]" color="#9b9b9b" />
    ),
    name: "Go to Notes",
  },
  {
    path: "/goals",
    icon: <Route02Icon className="min-h-[22px] min-w-[22px]" color="#9b9b9b" />,
    name: "Go to Goals",
  },
];

const commands = [
  {
    name: "New Chat",
    action: () => console.log("Create new note"),
    icon: (
      <PencilEdit02Icon className="min-h-[22px] min-w-[22px]" color="#9b9b9b" />
    ),
  },
];

export default function SearchCommand({
  openSearchDialog,
  setOpenSearchDialog,
}: {
  openSearchDialog: boolean;
  setOpenSearchDialog: Dispatch<SetStateAction<boolean>>;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const [filteredPages, setFilteredPages] = useState(pages);
  const [filteredCommands, setFilteredCommands] = useState(commands);
  const router = useRouter();
  const pathname = usePathname();
  const [results, setResults] = useState({
    conversations: [],
    messages: [],
    notes: [],
  });
  const [chipsVisibility, setChipsVisibility] = useState({
    messages: true,
    conversations: true,
    notes: true,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenSearchDialog((open) => !open);
      }
    };

    document.addEventListener("keydown", down);

    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    setOpenSearchDialog(false);
  }, [pathname]);

  const handleChipClick = (type: "conversations" | "messages" | "notes") => {
    setChipsVisibility((prevVisibilities) => ({
      ...prevVisibilities,
      [type]: !prevVisibilities[type],
    }));
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults({
        conversations: [],
        messages: [],
        notes: [],
      });

      return;
    }
    try {
      const response = await apiauth.get("/search", {
        params: { query: searchQuery },
      });

      setResults({
        conversations: response.data.conversations,
        messages: response.data.messages,
        notes: response.data.notes,
      });
    } catch (error) {
      console.error("Error fetching search results:", error);
      setResults({
        conversations: [],
        messages: [],
        notes: [],
      });
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
      setFilteredPages(
        pages.filter((page) =>
          page.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredCommands(
        commands.filter((command) =>
          command.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, handleSearch]);

  return (
    <CommandDialog open={openSearchDialog} onOpenChange={setOpenSearchDialog}>
      <CommandInput
        placeholder="Search for messages..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />

      {searchQuery && (
        <div className="flex gap-1 p-2 bg-zinc-900 text-sm text-foreground-500 items-center font-medium">
          {(results.messages.length > 0 ||
            results.conversations.length > 0 ||
            results.notes.length > 0) && <span className="mr-2">Filters:</span>}

          {results.messages.length > 0 && (
            <Chip
              // size="sm"
              className="cursor-pointer"
              classNames={{ content: "font-medium" }}
              color={chipsVisibility.messages ? "primary" : "default"}
              endContent={
                chipsVisibility.messages ? (
                  <Tick02Icon color="#000" />
                ) : undefined
              }
              startContent={
                <BubbleChatIcon
                  color={chipsVisibility.messages ? "#000000" : "#9b9b9b"}
                />
              }
              variant={chipsVisibility.messages ? "solid" : "faded"}
              onClick={() => handleChipClick("messages")}
            >
              Messages
            </Chip>
          )}
          {results.conversations.length > 0 && (
            <Chip
              className="cursor-pointer"
              classNames={{ content: "font-medium" }}
              color={chipsVisibility.conversations ? "primary" : "default"}
              endContent={
                chipsVisibility.conversations ? (
                  <Tick02Icon color="#000" />
                ) : undefined
              }
              size="sm"
              startContent={
                <BubbleConversationChatIcon
                  color={chipsVisibility.conversations ? "#000000" : "#9b9b9b"}
                />
              }
              variant={chipsVisibility.conversations ? "solid" : "faded"}
              onClick={() => handleChipClick("conversations")}
            >
              Conversations
            </Chip>
          )}
          {results.notes.length > 0 && (
            <Chip
              className="cursor-pointer"
              classNames={{ content: "font-medium" }}
              color={chipsVisibility.notes ? "primary" : "default"}
              endContent={
                chipsVisibility.notes ? <Tick02Icon color="#000" /> : undefined
              }
              size="sm"
              startContent={
                <StickyNote01Icon
                  color={chipsVisibility.notes ? "#000000" : "#9b9b9b"}
                />
              }
              variant={chipsVisibility.notes ? "solid" : "faded"}
              onClick={() => handleChipClick("notes")}
            >
              Notes
            </Chip>
          )}
        </div>
      )}

      <CommandList className="bg-zinc-900">
        <CommandGroup>
          {filteredCommands.map((command) => (
            <CommandItem
              key={command.name}
              className="cursor-pointer group !my-3"
              onSelect={() => {
                setOpenSearchDialog(false);
                command.action();
              }}
            >
              <div className="flex gap-2 items-center w-full">
                {command.icon}
                {command.name}
                <ArrowTopRightIcon className="text-foreground-500 ml-auto group-hover:text-[#00bbff] transition-all" />
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />

        <CommandGroup heading="Pages">
          {filteredPages.map((page) => (
            <CommandItem
              key={page.name}
              className="cursor-pointer group"
              onSelect={() => {
                setOpenSearchDialog(false);
                router.push(page.path);
              }}
            >
              <div className="flex gap-2 items-center w-full">
                {page.icon}
                {page.name}
                <ArrowTopRightIcon className="text-foreground-500 ml-auto group-hover:text-[#00bbff] transition-all" />
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {!!searchQuery &&
          chipsVisibility.messages &&
          !!results.messages &&
          results.messages.length > 0 && (
            <CommandGroup heading="Messages">
              {results.messages.map((message) => (
                <SearchCard
                  result={message}
                  type="message"
                  // searchQuery={searchQuery}
                />
              ))}
            </CommandGroup>
          )}

        {!!searchQuery &&
          chipsVisibility.conversations &&
          !!results.conversations &&
          results.conversations.length > 0 && (
            <CommandGroup heading="Conversations">
              {results.conversations.map((conversation) => (
                <SearchCard result={conversation} type="conversation" />
              ))}
            </CommandGroup>
          )}

        {!!searchQuery &&
          !!results.notes &&
          chipsVisibility.notes &&
          results.notes.length > 0 && (
            <CommandGroup heading="Notes">
              {results.notes.map((note) => (
                <SearchCard result={note} type="note" />
              ))}
            </CommandGroup>
          )}

        {!!searchQuery &&
          results.conversations.length == 0 &&
          results.messages.length == 0 && (
            <div className="text-sm p-3 text-center">No Results Found</div>
          )}
      </CommandList>

      {/* {!searchQuery && ( */}
      <div className="text-sm text-center p-2 bg-zinc-900 inline-flex gap-2 items-center justify-center text-foreground-500">
        <Lightbulb className="size-[20px] text-white relative left-1" />
        Tip: Hit
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded  bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 bg-zinc-600 text-white">
          <span className="text-xs">⌘</span>K
        </kbd>
        to open this Command Menu
      </div>
      {/* // )} */}
    </CommandDialog>
  );
}
