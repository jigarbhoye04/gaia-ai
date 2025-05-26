"use client";

import { Brain, Search, Settings, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import {
  SearchMode,
  useEnhancedTodoSearch,
} from "@/hooks/useEnhancedTodoSearch";
import { Todo, TodoUpdate } from "@/types/todoTypes";

import TodoList from "./TodoList";

interface EnhancedTodoSearchBarProps {
  onTodoUpdate: (todoId: string, updates: TodoUpdate) => void;
  onTodoDelete: (todoId: string) => void;
  onTodoClick?: (todo: Todo) => void;
  initialQuery?: string; // Optional initial search query
}

const searchModeConfig = {
  traditional: {
    label: "Traditional",
    icon: Search,
    description: "Text-based search through title and description",
  },
  semantic: {
    label: "Semantic Search",
    icon: Brain,
    description: "Semantic search for natural language queries",
  },
};

export default function EnhancedTodoSearchBar({
  onTodoUpdate,
  onTodoDelete,
  onTodoClick,
  initialQuery,
}: EnhancedTodoSearchBarProps) {
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    searchMode,
    searchOptions,
    search,
    clearSearch,
    updateSearchMode,
    updateSearchOptions,
  } = useEnhancedTodoSearch(300, initialQuery);

  const currentModeConfig = searchModeConfig[searchMode];
  const ModeIcon = currentModeConfig.icon;

  const handleModeChange = (mode: string) => {
    updateSearchMode(mode as SearchMode);
  };

  const getPlaceholder = () => {
    switch (searchMode) {
      case "semantic":
        return "Ask in natural language... (e.g., 'urgent tasks for this week')";
      default:
        return "Search todos...";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        {/* Search Mode Selector */}
        <Select value={searchMode} onValueChange={handleModeChange}>
          <SelectTrigger className="w-fit min-w-[140px] border-none bg-zinc-900 text-white shadow-none">
            <div className="flex items-center gap-2">
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="border-none bg-zinc-900 text-white shadow-lg">
            {Object.entries(searchModeConfig).map(([mode, config]) => {
              const IconComponent = config.icon;
              return (
                <SelectItem
                  key={mode}
                  value={mode}
                  className="border-none bg-zinc-900 text-white"
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder={getPlaceholder()}
            value={searchQuery}
            onChange={(e) => search(e.target.value)}
            className="border-none bg-zinc-800 pr-10 pl-10 text-white shadow-none focus:ring-0 focus:outline-none"
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

        {/* Advanced Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-none bg-zinc-900 text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 border-none bg-zinc-900 text-white shadow-lg"
          >
            <DropdownMenuLabel>Search Options</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {/* Current Mode Info */}
            <div className="text-muted-foreground px-2 py-2 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${currentModeConfig.color}`}
                />
                <span className="font-medium">
                  {currentModeConfig.label} Mode
                </span>
              </div>
              <p className="text-xs">{currentModeConfig.description}</p>
            </div>
            <DropdownMenuSeparator className="bg-zinc-800" />

            {/* Search Filters */}
            <DropdownMenuItem
              onClick={() =>
                updateSearchOptions({
                  includeCompleted: !searchOptions.includeCompleted,
                })
              }
              className="flex items-center justify-between bg-zinc-900 hover:bg-zinc-800"
            >
              <span>Include completed tasks</span>
              <div
                className={`h-4 w-4 rounded border ${
                  searchOptions.includeCompleted
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                }`}
              >
                {searchOptions.includeCompleted && (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="bg-zinc-900 hover:bg-zinc-800">
              <div className="w-full">
                <label className="mb-1 block text-sm font-medium">
                  Results limit
                </label>
                <Select
                  value={searchOptions.limit?.toString()}
                  onValueChange={(value) =>
                    updateSearchOptions({ limit: parseInt(value) })
                  }
                >
                  <SelectTrigger className="h-8 w-full border-none bg-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-none bg-zinc-900 text-white">
                    <SelectItem value="25">25 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                    <SelectItem value="100">100 results</SelectItem>
                    <SelectItem value="200">200 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Mode Badge and Info */}
      {searchQuery && (
        <div className="flex items-center gap-2 text-sm">
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-none bg-zinc-900 text-white"
          >
            <ModeIcon className="h-3 w-3" />
            {currentModeConfig.label}
          </Badge>
          <span className="text-muted-foreground">
            {currentModeConfig.description}
          </span>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="mt-4">
          {isSearching ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : searchError ? (
            <div className="py-4 text-center text-red-500">
              {searchError}
              {searchMode !== "traditional" && (
                <div className="text-muted-foreground mt-2 text-sm">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => updateSearchMode("traditional")}
                    className="h-auto p-0"
                  >
                    Try traditional search instead
                  </Button>
                </div>
              )}
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Found {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchMode === "semantic" && (
                  <Badge
                    variant="secondary"
                    className="border-none bg-zinc-900 text-xs text-white"
                  >
                    AI-powered results
                  </Badge>
                )}
              </div>
              <TodoList
                todos={searchResults}
                onTodoUpdate={onTodoUpdate}
                onTodoDelete={onTodoDelete}
                onTodoClick={onTodoClick}
              />
            </div>
          ) : (
            <div className="text-muted-foreground py-4 text-center">
              <p>No todos found matching "{searchQuery}"</p>
              {searchMode !== "traditional" && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => updateSearchMode("traditional")}
                  className="mt-2 h-auto p-0"
                >
                  Try traditional search instead
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
