import { useCallback, useEffect, useState } from "react";

import { todoApi } from "@/features/todo/api/todoApi";
import { Todo } from "@/types/features/todoTypes";

export type SearchMode = "traditional" | "semantic";

interface SearchOptions {
  mode: SearchMode;
  limit?: number;
  includeCompleted?: boolean;
  priority?: string; // Single priority value to match API
  project_id?: string; // Single project ID to match API
}

export const useEnhancedTodoSearch = (
  delay: number = 300,
  initialQuery?: string,
) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const [searchResults, setSearchResults] = useState<Todo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>("semantic");
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    mode: "semantic",
    limit: 50,
    includeCompleted: false,
  });

  // Initialize with query if provided
  useEffect(() => {
    if (initialQuery && initialQuery !== searchQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    // Clear results if search query is empty
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    // Set up debounced search
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        let results: Todo[];

        switch (searchOptions.mode) {
          case "semantic":
            results = await todoApi.semanticSearchTodos(searchQuery, {
              limit: searchOptions.limit,
              completed: searchOptions.includeCompleted,
              priority: searchOptions.priority,
              project_id: searchOptions.project_id,
            });
            break;
          case "traditional":
          default:
            results = await todoApi.searchTodos(searchQuery);
            break;
        }

        setSearchResults(results);
      } catch (error) {
        console.error("search error:", error);
        setSearchError("Failed to search todos");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, delay);

    // Cleanup timeout on query change or unmount
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchOptions, delay]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  }, []);

  const updateSearchMode = useCallback((mode: SearchMode) => {
    setSearchMode(mode);
    setSearchOptions((prev) => ({ ...prev, mode }));
  }, []);

  const updateSearchOptions = useCallback((options: Partial<SearchOptions>) => {
    setSearchOptions((prev) => ({ ...prev, ...options }));
  }, []);

  return {
    // search state
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    searchMode,
    searchOptions,

    // search actions
    search,
    clearSearch,
    updateSearchMode,
    updateSearchOptions,
  };
};
