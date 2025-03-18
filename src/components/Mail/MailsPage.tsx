"use client";

import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

import { EmailFrom } from "@/components/Mail/MailFrom";
import ViewEmail from "@/components/Mail/ViewMail";
import { InboxIcon } from "@/components/Misc/icons";
import { EmailData, EmailsResponse } from "@/types/mailTypes";
import { fetchEmails, formatTime } from "@/utils/mailUtils";

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
    [emails.length, hasNextPage],
  );

  const loadMoreItems = useCallback(
    async (_startIndex: number, _stopIndex: number) => {
      if (hasNextPage) await fetchNextPage();
    },
    [hasNextPage, fetchNextPage],
  );

  const openEmail = (email: EmailData) => {
    setSelectedEmail(email);
  };

  const Row = ({ index, style }: ListChildComponentProps) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="flex items-center justify-center">
          <Spinner />
        </div>
      );
    }
    const email = emails[index];
    if (!email) return null;

    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");

    const fetchSummary = (isOpen: boolean) => {
      if (isOpen && !title && !subtitle) {
        setTitle(email.subject);
        // email.snippet ? he.decode(email.snippet) : "No summary available"
        setSubtitle(
          "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dignissimos, commodi.",
        );
      }
    };

    return (
      <Tooltip
        showArrow
        placement="top"
        delay={400}
        closeDelay={0}
        shouldCloseOnInteractOutside={() => true}
        onOpenChange={fetchSummary}
        content={
          <div className="flex w-[300px] flex-col p-1">
            <div className="text-lg font-medium leading-tight">{title}</div>
            <div>{subtitle}</div>
          </div>
        }
        onClose={() => {
          return !!title && !!subtitle;
        }}
        color="foreground"
        radius="sm"
      >
        <div
          className={`flex cursor-pointer items-center gap-5 bg-black bg-opacity-45 p-3 px-6 transition-all duration-200 hover:bg-primary/20 hover:text-primary ${
            email?.labelIds?.includes("UNREAD")
              ? "font-medium"
              : "font-normal text-foreground-400"
          }`}
          style={style}
          onClick={() => openEmail(email)}
        >
          <div className="flex-[0.3] truncate">
            <EmailFrom from={email.from} />
          </div>
          <div className="flex-1 truncate">{email.subject}</div>
          <div className="text-sm opacity-50">{formatTime(email.time)}</div>
        </div>
      </Tooltip>
    );
  };
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const itemCount = hasNextPage ? emails.length + 1 : emails.length;

  return (
    <div className="h-full w-full pl-2">
      <h1 className="flex w-full items-center justify-start gap-2 pb-5">
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
            itemSize={55}
            onItemsRendered={onItemsRendered}
            ref={ref}
            width="100%"
            className="rounded-xl"
          >
            {Row}
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
