import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import {
  fetchLabels,
  fetchProjects,
  fetchTodoCounts,
  fetchTodos,
} from "@/redux/slices/todoSlice";
import { AppDispatch } from "@/redux/store";
import { TodoFilters } from "@/types/features/todoTypes";

interface UseTodoRefreshOptions {
  enabled?: boolean;
  refetchOnFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number | false;
  filters?: TodoFilters;
}

export const useTodoRefresh = ({
  enabled = true,
  refetchOnFocus = true,
  refetchOnReconnect = true,
  refetchInterval = false,
  filters = {},
}: UseTodoRefreshOptions = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const lastRefetchTime = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const shouldRefetch = () => {
    // Reduced minimum refetch interval for better responsiveness
    const minRefetchInterval = 5000; // 5 seconds (reduced from 30)
    const timeSinceLastRefetch = Date.now() - lastRefetchTime.current;
    return timeSinceLastRefetch >= minRefetchInterval;
  };

  const refetchData = async () => {
    if (!enabled || !shouldRefetch()) return;

    lastRefetchTime.current = Date.now();

    // Refresh all todo-related data in parallel
    await Promise.all([
      dispatch(fetchTodos({ filters, loadMore: false })),
      dispatch(fetchProjects()),
      dispatch(fetchLabels()),
      dispatch(fetchTodoCounts()),
    ]);
  };

  // Handle focus refetch
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return;

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        refetchData();
      }
    };

    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refetchOnFocus, enabled, filters]);

  // Handle reconnect refetch
  useEffect(() => {
    if (!refetchOnReconnect || !enabled) return;

    const handleOnline = () => {
      refetchData();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [refetchOnReconnect, enabled, filters]);

  // Handle interval refetch
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    intervalRef.current = setInterval(() => {
      refetchData();
    }, refetchInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refetchInterval, enabled, filters]);

  return {
    refetch: refetchData,
    lastRefetchTime: lastRefetchTime.current,
  };
};
