import { useCallback,useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import {
  fetchLabels,
  fetchProjects,
  fetchTodoCounts,
  fetchTodos,
} from "@/redux/slices/todoSlice";
import { AppDispatch } from "@/redux/store";
import { TodoFilters } from "@/types/features/todoTypes";

interface UseSmartTodoRefreshOptions {
  enabled?: boolean;
  filters?: TodoFilters;
  dependencies?: string[]; // Which data to refresh
}

interface RefreshState {
  lastRefresh: {
    todos: number;
    projects: number;
    labels: number;
    counts: number;
  };
  isRefreshing: boolean;
}

const REFRESH_INTERVALS = {
  todos: 60000, // 1 minute
  projects: 300000, // 5 minutes
  labels: 300000, // 5 minutes
  counts: 120000, // 2 minutes
};

export const useSmartTodoRefresh = ({
  enabled = true,
  filters = {},
  dependencies = ["todos", "projects", "labels", "counts"],
}: UseSmartTodoRefreshOptions = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const stateRef = useRef<RefreshState>({
    lastRefresh: {
      todos: 0,
      projects: 0,
      labels: 0,
      counts: 0,
    },
    isRefreshing: false,
  });

  const shouldRefresh = useCallback((type: keyof typeof REFRESH_INTERVALS) => {
    const now = Date.now();
    const lastRefresh = stateRef.current.lastRefresh[type];
    const interval = REFRESH_INTERVALS[type];
    return now - lastRefresh >= interval;
  }, []);

  const refreshData = useCallback(
    async (forceTypes?: string[]) => {
      if (!enabled || stateRef.current.isRefreshing) return;

      stateRef.current.isRefreshing = true;
      const typesToRefresh = forceTypes || dependencies;
      const refreshPromises = [];

      try {
        // Smart refresh based on what's needed and intervals
        if (typesToRefresh.includes("todos") && shouldRefresh("todos")) {
          refreshPromises.push(
            dispatch(fetchTodos({ filters, loadMore: false })).then(() => {
              stateRef.current.lastRefresh.todos = Date.now();
            }),
          );
        }

        if (typesToRefresh.includes("projects") && shouldRefresh("projects")) {
          refreshPromises.push(
            dispatch(fetchProjects()).then(() => {
              stateRef.current.lastRefresh.projects = Date.now();
            }),
          );
        }

        if (typesToRefresh.includes("labels") && shouldRefresh("labels")) {
          refreshPromises.push(
            dispatch(fetchLabels()).then(() => {
              stateRef.current.lastRefresh.labels = Date.now();
            }),
          );
        }

        if (typesToRefresh.includes("counts") && shouldRefresh("counts")) {
          refreshPromises.push(
            dispatch(fetchTodoCounts()).then(() => {
              stateRef.current.lastRefresh.counts = Date.now();
            }),
          );
        }

        await Promise.all(refreshPromises);
      } finally {
        stateRef.current.isRefreshing = false;
      }
    },
    [dispatch, enabled, filters, dependencies, shouldRefresh],
  );

  // Handle visibility change with smart refresh
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Only refresh data that's likely stale
        refreshData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, refreshData]);

  // Handle online/offline with smart refresh
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      // Force refresh all data when coming back online
      refreshData(["todos", "projects", "labels", "counts"]);
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, refreshData]);

  return {
    refreshData,
    isRefreshing: stateRef.current.isRefreshing,
    lastRefresh: stateRef.current.lastRefresh,
  };
};
