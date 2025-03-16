"use client";

import { useEmails } from "@/hooks/useEmails";
import EmailList from "@/components/Mail/EmailList";
import ViewEmail from "@/components/Mail/ViewMailDrawer";
import { useState, useCallback } from "react";
import { EmailData, EmailsPageProps } from "@/types/mailTypes";

export default function EmailsPage({ category, title }: EmailsPageProps) {
  const { data, isLoading, fetchNextPage, hasNextPage } = useEmails(category);
  const emails = data ? data.pages.flatMap((page) => page.emails) : [];
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);

  const loadMoreItems = useCallback(
    async () => {
      if (hasNextPage) await fetchNextPage();
    },
    [hasNextPage, fetchNextPage]
  );

  return (
    <div className="pl-2 w-full h-full">
      <h1 className="text-center">{title}</h1>
      <EmailList
        emails={emails}
        isLoading={isLoading}
        hasNextPage={hasNextPage || false}
        loadMoreItems={loadMoreItems}
        onEmailSelect={(email) => setSelectedEmail(email)}
      />
      <ViewEmail mail={selectedEmail} onOpenChange={() => setSelectedEmail(null)} />
    </div>
  );
}
