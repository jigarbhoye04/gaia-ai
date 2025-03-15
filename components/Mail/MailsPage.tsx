"use client";

import ViewEmail from "@/components/Mail/ViewMailDrawer";
import { InboxIcon } from "@/components/Misc/icons";
import { EmailData, EmailsResponse } from "@/types/mailTypes";
import { fetchEmails } from "@/utils/mailUtils";
import { Spinner } from "@heroui/spinner";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import { Row } from "./MailRow";

export default function MailsPage() {
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

  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);

  const isItemLoaded = useCallback(
    (index: number) => !hasNextPage || index < emails.length,
    [emails.length, hasNextPage]
  );

  const loadMoreItems = useCallback(
    async (_startIndex: number, _stopIndex: number) => {
      if (hasNextPage) await fetchNextPage();
    },
    [hasNextPage, fetchNextPage]
  );

  const openEmail = (email: EmailData) => {
    setSelectedEmail(email);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const itemCount = hasNextPage ? emails.length + 1 : emails.length;

  return (
    <div className="pl-2 w-full h-full">
      <h1 className="flex items-center gap-2 w-full justify-start pb-5">
        <InboxIcon color={undefined} width={25} height={25} />
        Inbox
      </h1>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <List
            height={window.innerHeight - 100}
            itemCount={itemCount}
            itemSize={80}
            onItemsRendered={onItemsRendered}
            ref={ref}
            width="100%"
            className="rounded-xl"
          >
            {({ index, style }) => (
              <Row
                index={index}
                style={style}
                data={{ emails, isItemLoaded, openEmail }}
              />
            )}
          </List>
        )}
      </InfiniteLoader>

      <ViewEmail
        mail={selectedEmail}
        onOpenChange={() => setSelectedEmail(null)}
      />
    </div>
  );
}
