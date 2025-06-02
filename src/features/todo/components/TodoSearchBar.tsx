"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import Spinner from "@/components/ui/shadcn/spinner";
import { useDebouncedTodoSearch } from "@/features/todo/hooks/useDebouncedTodoSearch";
import { Todo, TodoUpdate } from "@/types/features/todoTypes";

import TodoList from "./TodoList";

interface TodoSearchBarProps {
  onTodoUpdate: (todoId: string, updates: TodoUpdate) => void;
  onTodoDelete: (todoId: string) => void;
  onTodoClick?: (todo: Todo) => void;
}

export default function TodoSearchBar({
  onTodoUpdate,
  onTodoDelete,
  onTodoClick,
}: TodoSearchBarProps) {
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    search,
    clearSearch,
  } = useDebouncedTodoSearch(300);

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search todos..."
          value={searchQuery}
          onChange={(e) => search(e.target.value)}
          className="pr-10 pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {searchQuery && (
        <div className="mt-4">
          {isSearching ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : searchError ? (
            <div className="py-4 text-center text-red-500">{searchError}</div>
          ) : searchResults.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-2 text-sm">
                Found {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""}
              </p>
              <TodoList
                todos={searchResults}
                onTodoUpdate={onTodoUpdate}
                onTodoDelete={onTodoDelete}
                onTodoClick={onTodoClick}
              />
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No todos found matching "{searchQuery}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
