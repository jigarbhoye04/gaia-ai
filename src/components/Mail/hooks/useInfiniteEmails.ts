import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { EmailsResponse } from "@/types/mailTypes";
import { fetchEmails } from "@/utils/mailUtils";

/**
 * Hook for handling infinite loading of emails
 */
export const useInfiniteEmails = () => {
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery<
    EmailsResponse,
    Error,
    InfiniteData<EmailsResponse>,
    string[]
  >({
    queryKey: ["emails"],
    queryFn: fetchEmails,
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
  });

  const emails = data
    ? data.pages.flatMap((page: EmailsResponse) => page.emails)
    : [];

  const isItemLoaded = useCallback(
    (index: number, itemCount: number) => !hasNextPage || index < itemCount,
    [hasNextPage],
  );

  const loadMoreItems = useCallback(
    async (_startIndex: number, _stopIndex: number) => {
      if (hasNextPage) await fetchNextPage();
    },
    [hasNextPage, fetchNextPage],
  );

  return {
    data,
    emails,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isItemLoaded,
    loadMoreItems,
  };
};
