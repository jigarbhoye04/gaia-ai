import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { EmailsResponse } from "@/types/mailTypes";
import { fetchEmails, fetchImportantEmails } from "@/utils/mailUtils";

type EmailCategory = "inbox" | "important";

const fetcherMap = {
  inbox: fetchEmails,
  important: fetchImportantEmails,
};

/**
 * Generic hook to fetch emails based on the category (inbox or important)
 */
export const useEmails = (category: EmailCategory) => {
  return useInfiniteQuery<
    EmailsResponse,
    Error,
    InfiniteData<EmailsResponse>,
    string[]
  >({
    queryKey: ["emails", category],
    queryFn: fetcherMap[category],
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
  });
};
