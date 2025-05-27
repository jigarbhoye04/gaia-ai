import { useCallback, useEffect, useState } from "react";

import { TodoService } from "@/services/todoService";
import { Todo } from "@/types/todoTypes";

export const useDebouncedTodoSearch = (delay: number = 300) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Todo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
        const results = await TodoService.searchTodos(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchError("Failed to search todos");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, delay);

    // Cleanup timeout on query change or unmount
    return () => clearTimeout(timeoutId);
  }, [searchQuery, delay]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    search,
    clearSearch,
  };
};
